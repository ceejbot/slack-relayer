#!/usr/bin/env node

const
	create = require('../index'),
	bistre = require('bistre'),
	bole   = require('bole');

if (process.argv.length < 4)
{
	console.log('Usage: slack-relay #channel message');
	process.exit(1);
}

const channel = process.argv[2];
const message = process.argv.slice(3).join(' ');

var pretty = bistre({time: true});
bole.output([{level: 'debug', stream: pretty }]);
pretty.pipe(process.stdout);

const relayer = create({
	channel,
	token: process.env.SLACK_API_TOKEN || process.env.SLACK_TOKEN,
	event: 'cli'
});

relayer.handleEvent(message);
