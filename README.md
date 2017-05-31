# slack-relayer

Given a slack channel and an access token, send any string from anywhere in a node program to your Slack. As easy as `process.emit('slack', 'HALP!')`, no baton-passing needed.

## usage

```js
const createSlacker = require('slack-relayer');

 // returns the object just in case
const relayer = createSlacker({
	channel: 'bots',
	token: process.env.SLACK_API_TOKEN,
	event: 'event-to-listen-for'
});

// later on in another file...
process.emit('event-to-listen-for', 'I have a terrible pain in all the diodes down my left-hand side.');
// the relayer will then post this to slack for us with zero effort
```

You can use either a channel id or a channel name. It'll look up the channel id if you pass a name. It will maintain a backlog of up to 100 messages while it waits for the lookup, and unregister itself if it can't find the channel.

## bonus!

```
> npm install -g slack-relayer
> slack-relayer general "omg this is a thing"
```

You must have `SLACK_API_TOKEN` or `SLACK_TOKEN` set in your environment for this to work.

## license

ISC.
