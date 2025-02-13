# Discord.js v14 Record Bot

這是基於[PickachuTW](https://github.com/PikachuTW/)的[框架](https://github.com/PikachuTW/Discord.js-Command-Handler)所開發的Discord.js v14錄音機器人，你可以直接使用它或是基於它修改

## Requirements

* Node.js v20.12.2+
* NPM v10.5.0+

## Config

`config.ts`

```ts
interface config {
    settings: {
        prefix: string,
        activity: string,
        clientId: string,
        audioOutputPath: string,
        outputTimeFormat: string,
        autoLoadCommand: boolean,
        timeZone: string
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
        clientId: '你的機器人id',
        autoLoadCommand: true,
        audioOutputPath: '../foo/bar/', // 文件夾名稱即可
        outputTimeFormat: 'YYYY-MM-DD_HH-mm-ss', // 文件默认输出的时间格式
        timeZone: '你所在的時區'
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
            check: member => member.roles.cache.has('管理員的身份組id')
        },
        {
            level: 2,
            name: 'Owner',
            check: member => member.id === process.env.ownerId
        }
    ],
    commandPaths: ['./commands/ping', './commands/eval', './commands/joinChannel', './commands/leaveChannel', './commands/record', './commands/stop', './commands/permission'], // 可繼續接下去 以,分割 若autoLoadCommand爲true可以只留個空陣列
    eventPaths: new Map([
        // ['name', 'path']
        ['ready', './events/ready'],
        ['messageCreate', './events/messageCreate'],
        ['interactionCreate', './events/interactionCreate']
    ]),
    categoryList: new Map([
        ['system', '系統'],
        ['voice', '語音'],
        // ['economy'', '經濟']
    ])
};

export default config;
```

`.env`

```.env
token=你的token
```

## 注意事項

* 請自行創立.env文件並按照上面.env的段落填寫機器人的token和你的用户id
* `config.ts` 可設定機器人前綴與其活動狀態、權限設定、所要執行的指令、監聽的事件、錄音文件的位置等
* 下載程式碼之後請運行 `npm install`以安裝所需要的套件
* 若要運行， 請在命令行輸入`ts-node .`
* 若要增加新的類別 除了在指令的conf物件增加 還記得要在config.ts的categoryList裏面增加並且附上其譯名
* 最後對訊息的作者回傳的訊息請使用
```js
reply(message, { your: 'content' });
```
* 想要部署在replit或其他地方請自己想辦法
* 导出的录音文件为16比特PCM双声道48000Hz采样频率小端序的原始pcm文件 可用Audacity打开或是用ffmpeg转换成想要的文件格式