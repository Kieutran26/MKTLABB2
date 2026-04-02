import pathlib, re
files=[
    'components/StrategicModelGenerator.tsx',
    'components/STPModelGenerator.tsx',
    'components/PorterAnalyzer.tsx',
    'components/PESTELBuilder.tsx',
    'components/PersonaBuilder.tsx',
    'components/InsightFinder.tsx',
    'components/IMCPlanner.tsx',
    'components/BrandPositioningBuilder.tsx',
    'components/AudienceEmotionMap.tsx',
    'components/AdsHealthChecker.tsx',
    'components/ContentGenerator.tsx',
    'components/MastermindStrategy.tsx'
]
for f in files:
    p = pathlib.Path(f)
    if not p.exists():
        print('skip missing', f)
        continue
    text = p.read_text(encoding='utf-8')
    if '✍️ Thủ công' not in text:
        print('no emoji text in', f)
        continue
    new = text.replace('✍️ Thủ công', '<Pencil size={14} /> Thủ công')
    if new != text:
        pattern = r"import \{([^}]*)\} from ['\"]lucide-react['\"];"
        def repl(match):
            items = [item.strip() for item in match.group(1).split(',') if item.strip()]
            if 'Pencil' not in items:
                items.append('Pencil')
            return 'import {' + ', '.join(items) + '} from \'lucide-react\';'
        new, count = re.subn(pattern, repl, new, count=1)
        p.write_text(new, encoding='utf-8')
        print('updated', f)
    else:
        print('unchanged', f)
