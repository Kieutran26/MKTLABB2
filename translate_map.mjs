import fs from 'fs/promises';
import path from 'path';

async function translateText(text) {
    if (!text) return text;
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
        const res = await fetch(url);
        const json = await res.json();
        return json[0].map(x => x[0]).join('');
    } catch (e) {
        return text;
    }
}

async function run() {
  const htmlPath = path.join(process.cwd(), 'claudekit-skills-map.html');
  const htmlOut = await fs.readFile(htmlPath, 'utf8');
  
  // Extract agentsData
  const regex = /const agentsData = (\[[\s\S]*?\]);/;
  const match = htmlOut.match(regex);
  if (!match) {
      console.log("Could not find agentsData");
      return;
  }
  let agentsData = JSON.parse(match[1]);
  
  console.log(`Bắt đầu dịch ${agentsData.length} items sang Tiếng Việt bằng Translate API...`);

  // We translate properties sequentially to avoid rate limiting
  for (let i = 0; i < agentsData.length; i++) {
      let titleVi = await translateText(agentsData[i].title);
      agentsData[i].title = titleVi.replace('AI Agent: ', 'Trợ lý AI: ').replace('Skill: ', 'Kỹ năng: ');

      let viTasks = [];
      for (const t of agentsData[i].tasks) {
          let viT = await translateText(t);
          if (viT) viTasks.push(viT);
          await new Promise(r => setTimeout(r, 100)); // small delay
      }
      agentsData[i].tasks = viTasks;

      if (i % 20 === 0 && i !== 0) {
          console.log(`Đã dịch xong ${i}/${agentsData.length} phần tử...`);
      }
  }
  
  // Replace in HTML
  const newHtmlOut = htmlOut.replace(regex, `const agentsData = ${JSON.stringify(agentsData, null, 2)};`);
  await fs.writeFile(htmlPath, newHtmlOut, 'utf8');
  console.log('Dịch hoàn tất và đã lưu vào HTML!');
}

run();
