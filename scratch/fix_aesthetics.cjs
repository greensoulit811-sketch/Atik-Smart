const fs = require('fs');
const path = 'd:\\suhan\\Atik As Smart\\atikSmart\\src\\pages\\LandingPageView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace card container
content = content.replace(
  /className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all flex items-center gap-4 \${isSelected \? 'border-\[#ea580c\] bg-orange-50\/30' : 'border-gray-100 hover:border-gray-200 bg-gray-50\/30'}`}/g,
  "className={`relative p-3 border-2 rounded-2xl cursor-pointer transition-all flex items-center gap-4 ${isSelected ? 'border-[#ea580c] bg-orange-50/50 shadow-sm' : 'border-gray-100 hover:border-gray-200 bg-white'}`}"
);

// Replace image container
content = content.replace(
  /w-16 h-16 bg-white rounded-lg p-2 border border-gray-100 shrink-0/g,
  "w-20 h-20 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shrink-0"
);

// Replace image object-fit
content = content.replace(
  /object-contain/g,
  "object-cover"
);

// Replace text sizing
content = content.replace(
  /text-lg font-black text-\[#ea580c\]/g,
  "text-xl font-black text-[#ea580c]"
);

fs.writeFileSync(path, content);
console.log('Successfully updated LandingPageView.tsx');
