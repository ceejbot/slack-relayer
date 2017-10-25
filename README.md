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

// if you need to group specific events emit a key before your message
process.emit('event-to-listen-for', 'wisdom','a group of wombats');

```

You can use either a channel id or a channel name. It'll look up the channel id if you pass a name. It will maintain a backlog of up to 100 messages while it waits for the lookup, and unregister itself if it can't find the channel.

The slack api only wants one message per second. By default slack-relayer will group messsages that are emitted by key to prevent flooding the api. Every 10 seconds it will send them in a single post to slack.
If you emit more than 10 messages in 10 seconds only the last 10 will be shown in slack. This delay and truncation limit can be changed with optional options documented below.

## bonus!

```
> npm install -g slack-relayer
> slack-relayer general "omg this is a thing"
```

You must have `SLACK_API_TOKEN` or `SLACK_TOKEN` set in your environment for this to work.

## optional options

opts.prefix
    - this string prefix is put before every post to slack
    - defaults to ''. its a very good place to put the hostname and service name.

opts.lineLimit
    - the number of lines to buffer for each key
    - default 10
    - slack messages are limited to 4k otheriwse it'll truncate it for you.
    - consider adding your own listener to this event that calls your standard logging so events that dont post to slack can be reviewed.

opts.slackInterval
    - the rate at which this process posts to slack.
    - default 10000 ms

## license

ISC.
