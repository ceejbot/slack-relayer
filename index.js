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
                this.prefix = opts.prefix || '';
		this.allchannels = {};
		this.backlog = [];
		this.digests = {};
		this.chanid = null;
		this.slackInterval = opts.slackInterval||10000
		this.lineLimit = opts.lineLimit||10

		const func = (key,msg) => this.handleEvent(key, msg);

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

	handleEvent(key,message)
	{
		if (!message) 
		{
			message = key;
			key = '';
		}

		message = String(message);
		if (!this.chanid)
		{
			this.backlog.push([key,message]);
			if (this.backlog.length > 100)
				this.backlog = this.backlog.slice(-100);
			return;
		}

		this.maybePost(key,message);
	}

        maybePost(key, message)
        {
		key = key||''
		if(!this.digests[key]){
			this.digests[key] = {message:[],count:0,time:0}
		}
		
		this.digests[key].message.push(message)
		if(this.digests[key].message.length > this.lineLimit){
			this.digests[key].message = this.digests[key].message.slice(this.lineLimit*-1)
		}

		this.digests[key].count++
		this.digests[key].time = Date.now()

		this.postDigests()
        }

	postDigests()
	{
		if(this.posting) return;

		this.posting = true;

		var all = [];
		var digests = this.digests;
		this.digests = {};

		console.log(digests)
		var formatted = this.formatMessages(digests);
		Promise.all(formatted.map( message => {
			this.post(message)
		}))
		.then(()=>{
			setTimeout(() =>
			{
				this.posting = false;
				if(Object.keys(this.digests).length)
					this.postDigests();
			},this.slackInterval).unref()	
		})

	}

	formatMessages(digests)
	{
		var messages = [];

		Object.keys(digests).forEach((k) =>
		{
			var o = digests[k]
			var out;

			var out = (new Date(o.time)).toJSON() + '\n' 
			out += "> " + (k ?  k + ': ' : '') + o.message.join("\n>") + (o.count > this.lineLimit?'\n>...':'') + "\n";
			if(o.count > 1) out += o.count+' messages in '+(this.slackInterval/1000)+' seconds';

			messages.push(out);
		})

		return messages
	}

	post(message)
	{

		//return Promise.resolve();

		return this.slack.chat.postMessage(this.chanid,this.prefix+message).then(rez =>
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
			this.maybePost.apply(this,this.backlog.pop());
		}
	}
}

createRelayer.SlackRelayer = SlackRelayer;
