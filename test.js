/*global describe:true, it:true, before:true, after:true, beforeEach: true, afterEach:true */
'use strict';

var
	demand        = require('must'),
	createRelayer = require('./index'),
	sinon         = require('sinon')
	;

describe('slack-relayer', () =>
{
	const opts = {
		channel: 'C123456789',
		token  : 'no',
		event  : 'maybe'
	};

	it('exports a constructor', function()
	{
		createRelayer.must.be.a.function();
		const r = createRelayer({ channel: 'wat' });
		r.must.be.instanceof(createRelayer.SlackRelayer);
	});

	it('obeys its options', function()
	{
		const spy = sinon.spy(process, 'on');
		createRelayer({
			channel: 'ford',
			event: 'zaphod',
		});

		spy.called.must.be.true();
		spy.calledWith('zaphod').must.be.true();
		spy.restore();
	});

	it('defaults options when they are not provided', function()
	{
		const spy = sinon.spy(process, 'on');
		createRelayer({channel: 'channel'});
		spy.called.must.be.true();
		spy.calledWith('slack').must.be.true();
		spy.restore();
	});

	it('listens for the configured event', function(done)
	{
		const r = createRelayer(opts);
		r.handleEvent = function(msg)
		{
			msg.must.be.a.string();
			msg.must.equal('hey doll this guy boring you?');
			process.removeAllListeners('maybe');
			done();
		};
		process.emit('maybe', 'hey doll this guy boring you?');
	});

	it('posts to slack on receiving an event', function(done)
	{
		const r = createRelayer(opts);
		const original = 'Come with me. I\'m from another planet.';
		r.slack.chat.postMessage = function(channel, msg)
		{
			channel.must.equal(opts.channel);
			msg.must.equal(original);
			done();
		};
		process.emit('maybe', original);
	});

	it('logs on error', function(done)
	{
		const r = createRelayer(opts);
		const msg = 'With one degree in maths and another in astrophysics, it was either that or back to the dole queue on Monday.';
		var count = 0;

		r.slack.chat.postMessage = function()
		{
			return Promise.reject(new Error('wat'));
		};

		r.logger.error = function()
		{
			done();
		};
		r.handleEvent(msg);
	});

	it('debug-logs on success', function(done)
	{
		const r = createRelayer(opts);
		const msg = 'With one degree in maths and another in astrophysics, it was either that or back to the dole queue on Monday.';

		r.slack.chat.postMessage = function()
		{
			return Promise.resolve('hey hey');
		};

		r.logger.debug = function(msg)
		{
			msg.must.be.a.string();
			done();
		};
		r.handleEvent(msg);
	});
});
