import fs from 'fs/promises';
import path from 'path';

function transformItem(item) {
    let t = item.title.trim();
    if (t.toLowerCase().startsWith('kỹ năng:')) {
        t = "Tôi cung cấp " + t.slice(8).trim().toLowerCase();
    } else if (t.toLowerCase().startsWith('tác nhân ai:')) {
        t = "Tôi là " + t.slice(12).trim().toLowerCase();
    } else if (!t.toLowerCase().startsWith('tôi là')) {
        t = "Tôi là " + t.charAt(0).toLowerCase() + t.slice(1);
    }
    // format as a nice sentence
    if (!t.endsWith('.')) t += '.';
    item.title = t;

    // clean tasks
    let textDump = item.tasks.join(' ').replace(/người dùng:.*?(?=\.|$)/ig, '')
                                     .replace(/trợ lý:.*?(?=\.|$)/ig, '')
                                     .replace(/<.*?>/g, '')
                                     .replace(/\s+/g, ' ');

    let extracted = textDump.split(/(?<=\.|;)\s+/).map(x => x.trim()).filter(x => x.length > 10);
    // if we don't have enough conceptually, split by commas that have spaces
    if (extracted.length < 3) {
        let textDump2 = textDump.split(/,(?=\s)|\.|;/).map(x => x.trim()).filter(x => x.length > 6);
        extracted = textDump2;
    }

    let finalTasks = [];
    for(let i = 0; i < extracted.length; i++) {
        let task = extracted[i].replace(/^[-*]+/, '').trim();
        if(task) {
            task = task.charAt(0).toUpperCase() + task.slice(1);
            if(task.endsWith(',') || task.endsWith(';')) task = task.slice(0, -1);
            if(!task.endsWith('.')) task += '.';
            finalTasks.push(task);
        }
        if (finalTasks.length === 3) break;
    }

    while (finalTasks.length < 3) {
        if (finalTasks.length === 0) finalTasks.push("Thực thi các tác vụ được yêu cầu.");
        else if (finalTasks.length === 1) finalTasks.push("Hỗ trợ quy trình tự động hóa.");
        else finalTasks.push("Nâng cao hiệu suất công việc.");
    }

    item.tasks = finalTasks;
    return item;
}

async function run() {
  const htmlPath = path.join(process.cwd(), 'claudekit-skills-map.html');
  const htmlOut = await fs.readFile(htmlPath, 'utf8');
  
  const regex = /const agentsData = (\[[\s\S]*?\]);/;
  const match = htmlOut.match(regex);
  if (!match) {
      console.log("Could not find agentsData");
      return;
  }
  let agentsData = JSON.parse(match[1]);
  
  console.log(`Bắt đầu định dạng lại ${agentsData.length} items (Local JS)...`);
  agentsData = agentsData.map(transformItem);
  
  const newHtmlOut = htmlOut.replace(regex, `const agentsData = ${JSON.stringify(agentsData, null, 2)};`);
  await fs.writeFile(htmlPath, newHtmlOut, 'utf8');
  console.log('Cập nhật hoàn tất, đã lưu vào ' + htmlPath);
}

run();
