const fs = require('fs');
const path = require('path');

// 语言映射
const languageMap = {
    'handbook_EN.md': 'en',
    'handbook_JP.md': 'ja',
    'handbook_CHS.md': 'zhCN',
    'handbook_CHT.md': 'zhTW',
    'handbook_DE.md': 'de',
    'handbook_ES.md': 'es',
    'handbook_FR.md': 'fr',
    'handbook_ID.md': 'id',
    'handbook_KR.md': 'ko',
    'handbook_PT.md': 'pt',
    'handbook_RU.md': 'ru',
    'handbook_TH.md': 'th',
    'handbook_VI.md': 'vi'
};

// 解析单个文件
function parseHandbookFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const data = {};
    let currentSection = '';

    for (const line of lines) {
        // 检查是否是章节标题
        if (line.startsWith('## ')) {
            currentSection = line.substring(3);
            data[currentSection] = {};
        }
        // 检查是否是ID行
        else if (line.startsWith('ID:') && line.includes(' Name:')) {
            const match = line.match(/ID:(\d+) Name:([^<]+)/);
            if (match && currentSection) {
                const id = match[1];
                const name = match[2];
                data[currentSection][id] = name;
            }
        }
    }

    return data;
}

// 主函数
function generateTranslationDictionary() {
    const handbooksDir = path.join(__dirname, '../handbooks');
    const files = fs.readdirSync(handbooksDir).filter(file => file.endsWith('.md'));

    console.log('Found handbook files:', files);

    // 解析所有文件
    const allData = {};
    for (const file of files) {
        const langCode = languageMap[file];
        if (langCode) {
            console.log(`Processing ${file} (${langCode})...`);
            const filePath = path.join(handbooksDir, file);
            allData[langCode] = parseHandbookFile(filePath);
        }
    }

    // 生成翻译词典
    const translationDict = [];

    // 获取所有可能的章节
    const allSections = new Set();
    Object.values(allData).forEach(langData => {
        Object.keys(langData).forEach(section => allSections.add(section));
    });

    console.log('Found sections:', Array.from(allSections));

    // 为每个章节处理所有ID
    for (const section of allSections) {
        console.log(`Processing section: ${section}`);

        // 获取所有可能的ID
        const allIds = new Set();
        Object.values(allData).forEach(langData => {
            if (langData[section]) {
                Object.keys(langData[section]).forEach(id => allIds.add(id));
            }
        });

        // 为每个ID创建翻译条目
        for (const id of allIds) {
            const entry = { id, section };
            let hasTranslations = false;

            // 收集所有语言的翻译
            for (const [langCode, langData] of Object.entries(allData)) {
                if (langData[section] && langData[section][id]) {
                    entry[langCode] = langData[section][id];
                    hasTranslations = true;
                }
            }

            // 只添加有翻译的条目
            if (hasTranslations) {
                translationDict.push(entry);
            }
        }
    }

    console.log(`Generated ${translationDict.length} translation entries`);

    // 保存结果
    const outputPath = path.join(__dirname, '../translation_dictionary.json');
    fs.writeFileSync(outputPath, JSON.stringify(translationDict, null, 2), 'utf-8');
    console.log(`Translation dictionary saved to: ${outputPath}`);

    // 也生成一个压缩版本
    const compactOutputPath = path.join(__dirname, '../translation_dictionary_compact.json');
    fs.writeFileSync(compactOutputPath, JSON.stringify(translationDict), 'utf-8');
    console.log(`Compact version saved to: ${compactOutputPath}`);

    // 显示一些统计信息
    console.log('\nStatistics:');
    console.log(`Total entries: ${translationDict.length}`);

    const sectionStats = {};
    translationDict.forEach(entry => {
        if (!sectionStats[entry.section]) {
            sectionStats[entry.section] = 0;
        }
        sectionStats[entry.section]++;
    });

    console.log('Entries per section:');
    Object.entries(sectionStats).forEach(([section, count]) => {
        console.log(`  ${section}: ${count}`);
    });

    // 显示语言覆盖率
    const langStats = {};
    Object.keys(languageMap).forEach(file => {
        const lang = languageMap[file];
        langStats[lang] = 0;
    });

    translationDict.forEach(entry => {
        Object.keys(entry).forEach(key => {
            if (key !== 'id' && key !== 'section' && langStats.hasOwnProperty(key)) {
                langStats[key]++;
            }
        });
    });

    console.log('\nLanguage coverage:');
    Object.entries(langStats).forEach(([lang, count]) => {
        console.log(`  ${lang}: ${count} entries`);
    });

    return translationDict;
}

// 如果直接运行此脚本
if (require.main === module) {
    try {
        generateTranslationDictionary();
    } catch (error) {
        console.error('Error generating translation dictionary:', error);
        process.exit(1);
    }
}

module.exports = { generateTranslationDictionary }; 