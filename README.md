# Discord.js v14 Command Handler but TypeScript

這是基於[PickachuTW](https://github.com/PikachuTW/)的[框架](https://github.com/PikachuTW/Discord.js-Command-Handler)所開發的Discord.js v14機器人，你可以用它開始搭建機器人

## Requirements

* Node.js v20.12.2+
* NPM v10.5.0+

## Config
```ts
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
            check: member => member.roles.cache.has('管理員身份組id')
        },
        {
            level: 2,
            name: 'Owner',
            check: member => member.id === '你的id'
        }
    ],
    commandPaths: ['./commands/ping', './commands/114514'], // 可接着寫輸入指令文件的所在路徑
    eventPaths: new Map([
        // ['事件名稱', '事件執行路徑']
        ['ready', './events/ready']
    ])
};

export default config;
```

```.env
token=你的token
```

## 注意事項

* 請自行創立.env文件並按照上面.env的段落填寫機器人的token
* `config.ts` 可設定機器人前綴與其活動狀態、權限設定
* 下載之後請運行 `npm install` ，安裝所需要的套件
* 若要運行， 請在命令行輸入`ts-node .`
* 想要部署在replit或其他地方請自己想辦法