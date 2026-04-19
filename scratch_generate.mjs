import fs from 'fs/promises';
import path from 'path';

async function run() {
  const agentsData = [];
  
  // 1. Parse Agents from .claude/agents
  const agentsPath = path.join(process.cwd(), '.claude', 'agents');
  try {
      const agentFiles = await fs.readdir(agentsPath);
      for (const file of agentFiles) {
        if (!file.endsWith('.md')) continue;
        const content = await fs.readFile(path.join(agentsPath, file), 'utf8');
        let name = file.replace('.md', '');
        let title = name.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        let descMatch = content.match(/description:\s*(.+)/);
        let description = descMatch ? descMatch[1] : '';
        
        let type = 'Management'; // default
        let group = 'Marketing Kit'; // default
        let tasks = [];
        
        const contentLower = content.toLowerCase();
        
        // Simple classification based on content
        if (contentLower.includes('seo') || contentLower.includes('keyword')) { type = 'SEO'; group = 'Marketing Kit'; }
        else if (contentLower.includes('content') || contentLower.includes('copywrit')) { type = 'Content'; group = 'Marketing Kit'; }
        else if (contentLower.includes('backend') || contentLower.includes('fullstack')) { type= 'Backend'; group = 'Engineer Kit'; }
        else if (contentLower.includes('ui') || contentLower.includes('frontend')) { type= 'Frontend'; group = 'Engineer Kit'; }
        else if (contentLower.includes('database')) { type='Backend'; group = 'Engineer Kit'; }
        else if (contentLower.includes('test') || contentLower.includes('debug')) { type='Testing'; group = 'Engineer Kit'; }
        else if (contentLower.includes('marketing') || contentLower.includes('campaign') || contentLower.includes('analytics')) { type='Campaign'; group = 'Marketing Kit'; }
        else if (contentLower.includes('sales') || contentLower.includes('lead') || contentLower.includes('upsell')) { type='Sale'; group = 'Marketing Kit'; }
        else if (contentLower.includes('github') || contentLower.includes('git ') || contentLower.includes('code')) { type='Architecture'; group = 'Engineer Kit'; }
        else { group = 'Engineer Kit'; type = 'Management'; }

        // Attempt to extract better role
        let roleMatch = content.match(/You are a? (.*?)\./);
        let roleDesc = roleMatch ? roleMatch[1] : `AI Agent: ${title}`;
        
        // Split description by period or bullet points
        let splitDesc = description.replace(/\\n/g, ' ').split(/(?<=\.)\s+/).filter(x => x.trim().length > 0 && !x.includes('<example>'));
        tasks = splitDesc.slice(0, 3).map(x => x.replace(/Example.*/i, '').trim()).filter(x => x.length > 5);
        if (tasks.length === 0) tasks = ['Được cấu hình để hoạt động trong môi trường tự động'];

        agentsData.push({
          name: title,
          call: '@' + name,
          group,
          type,
          title: roleDesc.charAt(0).toUpperCase() + roleDesc.slice(1),
          tasks: tasks.map(t => t.replace(/['"]/g, ''))
        });
      }
  } catch(e) { console.error('Error reading agents', e) }

  // 2. Parse Skills from .agents/skills
  const skillsPath = path.join(process.cwd(), '.agents', 'skills');
  try {
      const skillDirs = await fs.readdir(skillsPath);
      for (const dir of skillDirs) {
        let skillMdPath = path.join(skillsPath, dir, 'SKILL.md');
        let content;
        try {
            content = await fs.readFile(skillMdPath, 'utf8');
        } catch(e) { continue; }
        
        let nameMatch = content.match(/name:\s*(.+)/);
        let actualName = nameMatch ? nameMatch[1].trim() : dir;
        
        let descMatch = content.match(/description:\s*(.+)/);
        let description = descMatch ? descMatch[1] : '';
        
        let titleMatch = content.match(/#\s*(.+)/);
        let titleHeader = titleMatch && titleMatch[1] !== 'SKILL.md' ? titleMatch[1].trim() : actualName;
        titleHeader = titleHeader.replace(/\\r(.*)*/, '').trim();

        // If it starts with ckm:, it's Marketing Kit. If ck: or anything else, Engineer Kit.
        let group = actualName.startsWith('ckm:') ? 'Marketing Kit' : 'Engineer Kit';
        let type = 'Skill';
        
        const cLow = content.toLowerCase();
        if (cLow.match(/seo|keyword/i)) type = 'SEO';
        else if (cLow.match(/content|copy|writ/i)) type = 'Content';
        else if (cLow.match(/social|youtube|video/i)) type = 'Social';
        else if (cLow.match(/analytics|data|report/i)) type = 'Analytics';
        else if (cLow.match(/ads|campaign/i)) type = 'Ads';
        else if (cLow.match(/frontend|ui|design|react|tailwind/i)) type = 'Frontend';
        else if (cLow.match(/backend|database|api|postgres|node/i)) type = 'Backend';
        else if (cLow.match(/test|debug|bug/i)) type = 'Testing';
        else if (cLow.match(/github|git|deploy|docker/i)) type = 'Workflow';
        else if (cLow.match(/brand|logo/i)) type = 'Design';
        
        let splitDesc = description.replace(/\\n/g, ' ').split(/(?<=\.)\s+/).filter(x => x.trim().length > 0);
        let tasks = splitDesc.slice(0, 3).map(x => x.replace(/Example.*/i, '').trim()).filter(x => x.length > 5);
        if (tasks.length === 0) tasks = ['Cung cấp khả năng thực thi lệnh chuyên sâu'];

        let niceName = actualName.replace('ck:', '').replace('ckm:', '').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

        agentsData.push({
          name: niceName,
          call: '/' + actualName,
          group,
          type,
          title: `Skill: ${titleHeader.substring(0, 50)}`,
          tasks: tasks.map(t => t.replace(/['"]/g, ''))
        });
      }
  } catch(e) { console.error('Error reading skills', e) }

  // Overwrite HTML logic
  const htmlPath = path.join(process.cwd(), 'claudekit-skills-map.html');
  const htmlOut = await fs.readFile(htmlPath, 'utf8');
  
  // replace const agentsData = [...]; with newly generated string
  const regex = /const agentsData = \[[\s\S]*?\];/;
  const newHtmlOut = htmlOut.replace(regex, `const agentsData = ${JSON.stringify(agentsData, null, 2)};`);
  
  await fs.writeFile(htmlPath, newHtmlOut, 'utf8');
  console.log('Successfully generated complete HTML MAP. Total items: ' + agentsData.length);
}

run();
