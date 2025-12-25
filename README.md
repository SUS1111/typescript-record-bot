# Discord.js v14 Record Bot

這是基於[PickachuTW](https://github.com/PikachuTW/)的[框架](https://github.com/PikachuTW/Discord.js-Command-Handler)所開發的Discord.js v14錄音機器人，你可以直接使用它或是基於它修改

## Requirements

* Node.js v22.14.0+
* NPM v10.9.2+

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
        clientId: '你的機器人id',
        autoLoadCommand: true,
        audioOutputPath: '../foo/bar/', // 文件夾名稱即可
        outputTimeFormat: 'YYYY-MM-DD_HH-mm-ss', // 文件默认输出的时间格式
        timeZone: '你所在的時區',
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
        ['clientReady', './events/clientReady'],
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
token=機器人的token
ownerId=你的ID
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
* 匯出的錄音檔案為16位元小端序的原始pcm檔案 可用Audacity開啟或是用ffmpeg轉換成想要的檔案格式
* 錄音檔案的取樣頻率可從8000Hz, 12000Hz, 16000Hz, 24000Hz和48000Hz中任選一個，並且可選擇單聲道或是雙聲道
* 由於Discord似乎限制了聲道數量，因此推薦選擇單聲道即可