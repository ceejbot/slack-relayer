'use strict';

const
	assert = require('assert'),
	bole   = require('bole'),
	slack  = require('@slack/client')
	;

const createRelayer = module.exports = function createRelayer(opts)
{
	assert(opts, 'you must pass an options object to the creator');
	assert(opts.channel, 'you must pass a channel to post to!');
	opts.event = opts.event || 'slack';
	opts.token = opts.token || process.env.SLACK_API_TOKEN || process.env.SLACK_TOKEN;

	return new SlackRelayer(opts);
};

class SlackRelayer
{
	constructor(opts)
	{
		this.channel = opts.channel;
		this.slack = new slack.WebClient(opts.token);
		this.logger = bole(opts.event);
		this.allchannels = {};
		this.backlog = [];
		this.chanid = null;

		const func = msg => this.handleEvent(msg);

		if (opts.channel.startsWith('C') && opts.channel.length === 10)
			this.chanid = opts.channel;
		else
		{
			this.slack.channels.list((err, info) =>
			{
				if (err) return this.logger.error(err.message);

				info.channels.forEach(c => { this.allchannels[c.name] = c.id; });
				this.chanid = this.allchannels[opts.channel];
				if (!this.chanid)
				{
					this.logger.warn(`can't find a channel named ${opts.channel}!`);
					this.logger.warn('giving up & dropping backlog on the floor');
					process.removeListener(opts.event, func);
					this.backlog = [];
				}
				else
					this.handleBacklog();
			});
		}

		process.on(opts.event, func);
	}

	handleEvent(message)
	{
		message = String(message);
		if (!this.chanid)
		{
			this.backlog.push(message);
			if (this.backlog.length > 100)
				this.backlog = this.backlog.slice(-100);
			return;
		}

		this.post(message);
	}

	post(message)
	{
		this.slack.chat.postMessage(this.chanid, message).then(rez =>
		{
			this.logger.debug(`posted message: ${message}`);
		}).catch(err =>
		{
			this.logger.error(`unexpected problem posting to slack; err=${err.message}`);
			this.logger.warn(message);
		});
	}

	handleBacklog()
	{
		// YOLO!!!!!!!!
		while (this.backlog.length)
		{
			this.post(this.backlog.pop());
		}
	}
}

createRelayer.SlackRelayer = SlackRelayer;
