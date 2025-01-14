interface config {
    settings: {
        prefix: string,
        activity: string,
        clientId: string,
        audioOutputDicPath: string,
        autoLoadCommand: boolean
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
        clientId: '1236596820755349505',
        audioOutputDicPath: '../../音樂/', // 文件夾名稱即可
        autoLoadCommand: true
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
            check: member => member.id === '785496543141560371'
        }
    ],
    commandPaths: ['./commands/ping', './commands/eval', './commands/joinChannel', './commands/leaveChannel', './commands/record', './commands/stop'], // 可繼續接下去 以,分割 若autoLoadCommand爲true可以只留個空陣列
    eventPaths: new Map([
        // ['name', 'path']
        ['ready', './events/ready'],
        ['messageCreate', './events/messageCreate'],
        ['interactionCreate', './events/interactionCreate']
    ]),
    categoryList: new Map([
        ['system', '系統'],
        ['voice', '語音']
    ])
};

export default config;