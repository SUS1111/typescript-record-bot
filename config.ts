interface config {
    settings: {
        prefix: string,
        activity?: string,
        clientId: string,
        audioOutputPath: string,
        outputTimeFormat: string,
        autoLoadCommand: boolean,
        timeZone: string,
        sampleRate: 8_000 | 12_000 | 16_000 | 24_000 | 48_000
        channelCount: 1 | 2
    };
    permLevels: { level: number, name: string, check: (member: any) => boolean }[];
    commandPaths: string[];
    eventPaths: Map<string, string>;
    categoryList: Map<string, string>;
}

const config: config = {
    settings: {
        prefix: 's!',
        activity: '簡單試下機器人',
        clientId: '1336590336906231819',
        autoLoadCommand: true,
        audioOutputPath: '../../音樂/', // 文件夾名稱即可
        outputTimeFormat: 'YYYY-MM-DD_HH-mm-ss', // 文件默认输出的时间格式
        timeZone: 'Asia/Kuala_Lumpur',
        sampleRate: 48_000,
        channelCount: 1
    },
    permLevels: [
        {
            level: 0,
            name: 'User',
            check: () => true
        },
        {
            level: 1,
            name: 'Staff',
            check: member => member.roles.cache.has('945279453871869984')
        },
        {
            level: 2,
            name: 'Owner',
            check: member => member.id === process.env.ownerId
        }
    ],
    commandPaths: ['./commands/ping', './commands/eval', './commands/joinChannel', './commands/leaveChannel', './commands/record', './commands/stop', './commands/permission', './commands/recordStatus'], // 可繼續接下去 以,分割 若autoLoadCommand爲true可以只留個空陣列
    eventPaths: new Map([
        // ['name', 'path']
        ['clientReady', './events/clientReady'],
        ['messageCreate', './events/messageCreate'],
        ['interactionCreate', './events/interactionCreate'],
        ['error', './events/error']
    ]),
    categoryList: new Map([
        ['system', '系統'],
        ['voice', '語音']
    ])
};

export default config;