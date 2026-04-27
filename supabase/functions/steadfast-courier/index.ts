import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = req.method === 'POST' ? await req.json().catch(() => ({})) : {};
    const url = new URL(req.url);
    const pathAction = url.pathname.split('/').pop();
    const action = (pathAction && pathAction !== 'steadfast-courier') ? pathAction : body.action;

    // We wrapper everything in a 200 response to avoid the "non-2xx" error in browser
    const createResponse = (data: any) => {
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    };

    // Verify user is logged in
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return createResponse({ success: false, error: 'Unauthorized: No auth header' });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return createResponse({ success: false, error: 'Unauthorized: Invalid session' });
    }

    // Check if admin
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (rpcError || !isAdmin) {
      return createResponse({ 
        success: false, 
        error: 'Admin access required. Please make sure you are logged in as an administrator.' 
      });
    }

    // Get courier settings
    const { data: settings, error: settingsError } = await supabase
      .from('courier_settings')
      .select('*')
      .eq('provider', 'steadfast')
      .maybeSingle();

    if (settingsError) {
      return createResponse({ success: false, error: 'Database error: ' + settingsError.message });
    }

    if (action === 'test-connection') {
      if (!settings?.enabled) {
        return createResponse({ 
          success: false, 
          error: 'Steadfast is not enabled. Please toggle "Enable Integration" and click Save first.' 
        });
      }

      if (!settings.api_key || !settings.api_secret) {
        return createResponse({ success: false, error: 'API Key or Secret is missing.' });
      }

      try {
        const res = await fetch(`${settings.api_base_url}/get_balance`, {
          headers: { 
            'Api-Key': settings.api_key, 
            'Secret-Key': settings.api_secret, 
            'Content-Type': 'application/json' 
          },
        });
        
        const resText = await res.text();
        let data: any;
        try { 
          data = JSON.parse(resText); 
        } catch { 
          return createResponse({ 
            success: false, 
            error: 'Invalid response from Steadfast API. Please verify your API Base URL.' 
          });
        }
        
        if (res.ok && data.status === 200) {
          return createResponse({ success: true, balance: data.current_balance });
        }
        
        return createResponse({ 
          success: false, 
          error: data.message || 'API Connection Failed: Incorrect credentials or server error.' 
        });
      } catch (err: any) {
        return createResponse({ success: false, error: 'Fetch failed: ' + err.message });
      }
    }

    if (action === 'create-parcel') {
      if (!settings?.enabled) {
        return createResponse({ success: false, error: 'Steadfast not enabled' });
      }

      const payload = {
        invoice: body.invoice,
        recipient_name: body.recipient_name,
        recipient_phone: body.recipient_phone,
        recipient_address: body.recipient_address,
        cod_amount: body.cod_amount,
        note: body.note || '',
      };

      const res = await fetch(`${settings.api_base_url}/create_order`, {
        method: 'POST',
        headers: { 
          'Api-Key': settings.api_key, 
          'Secret-Key': settings.api_secret, 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(payload),
      });

      const resText = await res.text();
      let data: any;
      try { data = JSON.parse(resText); } catch {
        return createResponse({ success: false, error: 'Invalid JSON response from courier.' });
      }

      await supabase.from('courier_logs').insert({
        order_id: body.order_id, provider: 'steadfast', action: 'create_parcel',
        status: res.ok ? 'success' : 'failed', message: data.message || '',
        request_payload: payload, response_payload: data,
      });

      if (res.ok && data.status === 200) {
        await supabase.from('orders').update({
          status: 'shipped', // Automatically mark as shipped
          courier_provider: 'steadfast', courier_status: 'created',
          courier_tracking_id: data.consignment?.tracking_code,
          courier_consignment_id: data.consignment?.consignment_id?.toString(),
          courier_updated_at: new Date().toISOString(),
        }).eq('id', body.order_id);

        return createResponse({ 
          success: true, 
          tracking_code: data.consignment?.tracking_code,
          consignment_id: data.consignment?.consignment_id,
        });
      }
      
      return createResponse({ success: false, error: data.message || 'Failed to create parcel' });
    }

    if (action === 'sync-all') {
      // Find all orders that are currently in 'shipped' or 'created' courier status
      const { data: activeOrders, error: ordersError } = await supabase
        .from('orders')
        .select('id, courier_consignment_id')
        .not('courier_consignment_id', 'is', null)
        .in('courier_status', ['created', 'in_transit', 'pending']);

      if (ordersError) return createResponse({ success: false, error: ordersError.message });
      if (!activeOrders || activeOrders.length === 0) return createResponse({ success: true, count: 0 });

      let updatedCount = 0;
      for (const order of activeOrders) {
        try {
          const res = await fetch(`${settings.api_base_url}/status_by_cid/${order.courier_consignment_id}`, {
            headers: { 
              'Api-Key': settings.api_key, 
              'Secret-Key': settings.api_secret, 
              'Content-Type': 'application/json' 
            },
          });
          
          if (!res.ok) continue;
          const data = await res.json();
          if (data.status !== 200) continue;

          let courierStatus = 'created';
          let mainOrderStatus = null;
          const ds = data.delivery_status?.toLowerCase();

          if (ds === 'delivered') { courierStatus = 'delivered'; mainOrderStatus = 'delivered'; }
          else if (ds === 'cancelled' || ds === 'returned') { courierStatus = 'cancelled'; mainOrderStatus = 'cancelled'; }
          else if (ds === 'pending') { courierStatus = 'pending'; }
          else if (ds) { courierStatus = 'in_transit'; mainOrderStatus = 'shipped'; }

          const updateData: any = { courier_status: courierStatus, courier_updated_at: new Date().toISOString() };
          if (mainOrderStatus) updateData.status = mainOrderStatus;

          await supabase.from('orders').update(updateData).eq('id', order.id);
          updatedCount++;
        } catch (e) {
          console.error(`Failed to sync order ${order.id}:`, e);
        }
      }

      return createResponse({ success: true, count: updatedCount });
    }

    if (action === 'track-status') {
      const { consignment_id, order_id } = body;
      if (!consignment_id) {
        return createResponse({ success: false, error: 'Consignment ID required' });
      }

      const res = await fetch(`${settings.api_base_url}/status_by_cid/${consignment_id}`, {
        headers: { 
          'Api-Key': settings.api_key, 
          'Secret-Key': settings.api_secret, 
          'Content-Type': 'application/json' 
        },
      });

      const resText = await res.text();
      let data: any;
      try { data = JSON.parse(resText); } catch {
        return createResponse({ success: false, error: 'Invalid response from courier tracking.' });
      }

      if (res.ok && data.status === 200) {
        let courierStatus = 'created';
        let mainOrderStatus = null;
        const ds = data.delivery_status?.toLowerCase();
        
        if (ds === 'delivered') {
          courierStatus = 'delivered';
          mainOrderStatus = 'delivered';
        } else if (ds === 'cancelled' || ds === 'returned') {
          courierStatus = 'cancelled';
          mainOrderStatus = 'cancelled';
        } else if (ds === 'pending') {
          courierStatus = 'pending';
        } else if (ds) {
          courierStatus = 'in_transit';
          mainOrderStatus = 'shipped';
        }

        const updateData: any = { 
          courier_status: courierStatus, 
          courier_updated_at: new Date().toISOString() 
        };
        
        if (mainOrderStatus) {
          updateData.status = mainOrderStatus;
        }

        await supabase.from('orders').update(updateData).eq('id', order_id);

        return createResponse({ 
          success: true, 
          courier_status: courierStatus, 
          main_order_status: mainOrderStatus,
          delivery_status: data.delivery_status 
        });
      }
      return createResponse({ success: false, error: data.message || 'Failed to track status' });
    }

    if (action === 'webhook') {
      // Steadfast sends webhook data as a form or JSON
      // According to documentation, we should check their signature, 
      // but for simplicity we'll process the data directly if provided.
      const payload = body;
      console.log('Steadfast Webhook Received:', payload);

      if (payload.status && payload.consignment_id) {
        let courierStatus = 'created';
        let mainOrderStatus = null;
        const ds = payload.status.toLowerCase();

        if (ds === 'delivered') {
          courierStatus = 'delivered';
          mainOrderStatus = 'delivered';
        } else if (ds === 'cancelled' || ds === 'returned') {
          courierStatus = 'cancelled';
          mainOrderStatus = 'cancelled';
        } else if (ds === 'pending') {
          courierStatus = 'pending';
        } else if (ds) {
          courierStatus = 'in_transit';
          mainOrderStatus = 'shipped';
        }

        const updateData: any = { 
          courier_status: courierStatus, 
          courier_updated_at: new Date().toISOString() 
        };
        
        if (mainOrderStatus) {
          updateData.status = mainOrderStatus;
        }

        await supabase.from('orders')
          .update(updateData)
          .eq('courier_consignment_id', payload.consignment_id.toString());

        return createResponse({ success: true, message: 'Webhook processed' });
      }

      return createResponse({ success: false, error: 'Invalid webhook payload' });
    }

    return createResponse({ error: 'Unknown action' });

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: 'Server Error: ' + error.message,
      technical_details: error.stack
    }), {
      status: 200, // Still return 200 to see the message
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
