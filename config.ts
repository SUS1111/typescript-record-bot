interface config {
    settings: {
        prefix: string,
        activity: string
    };
    permLevels: { level: number, name: string, check: (member: any) => boolean }[];
    commandPaths: string[];
    eventPaths: Map<string, string>;
}

const config:config = {
    settings: {
        prefix: 's!',
        activity: '簡單試下機器人'
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
    commandPaths: ['./commands/ping', './commands/eval'], // 
    eventPaths: new Map([
        // ['name', 'path']
        ['ready', './events/ready'],
        ['messageCreate', './events/messageCreate']
    ])
};

export default config;