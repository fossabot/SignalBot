const { MessageEmbed } = require('discord.js');

/**
 * Signal's Custom Reaction Menu Creator
 * @class
 * @author Joshua Clements <josh@penpow.dev>
 * @description Custom Reaction Menu Handler
 * @public
 */
class ReactionMenu {

	/**
     * Create new ReactionMenu
     * @param {Client} client
     * @param {TextChannel} channel
     * @param {GuildMember} member
     * @param {MessageEmbed} embed
     * @param {Array} arr
     * @param {int} interval
     * @param {Object} reactions
     * @param {int} timeout
     */
	constructor(client, channel, member, embed, arr = null, interval = 10, reactions = {
		'⏪': this.first.bind(this),
		'◀': this.previous.bind(this),
		'▶️': this.next.bind(this),
		'⏩': this.last.bind(this),
		'⏹️': this.stop.bind(this),
	}, timeout = 600000) {

		/**
         * Signal Client
         * @type {Client}
         */
		this.client = client;

		/**
         * Text Channel
         * @type {TextChannel}
         */
		this.channel = channel;

		/**
         * The Member ID Snowflake
         * @type {string}
         */
		this.memberId = member.id;

		/**
         * The embed passed to the Reaction Menu
         * @type {MessageEmbed}
         */
		this.embed = embed;

		/**
         * JSON from the embed
         * @type {Object}
         */
		this.json = this.embed.toJSON();

		/**
         * Array to be iterated over
         * @type {Array}
         */
		this.array = arr;

		/**
         * The size of each array window
         * @type {int}
         */
		this.interval = interval;

		/**
         * The current array window start
         * @type {int}
         */
		this.current = 0;

		/**
         * The max length of the array
         * @type {int}
         */
		this.max = (this.array) ? arr.length : null;

		/**
         * The reactions for the menu
         * @type {Object}
         */
		this.reactions = reactions;

		/**
         * The emojis used as keys
         * @type {Array<string>}
        */
		this.emojis = Object.keys(this.reactions);

		/**
        * The collector timeout
        * @type {int}
        */
		this.timeout = timeout;

		const first = new MessageEmbed(this.json);
		const description = (this.array) ? this.array.slice(this.current, this.interval) : null;

		if(description) {
			first.setTitle(`${this.embed.title} ${this.client.utils.getRange(this.array, this.current, this.interval)}`)
				.setDescription(description.toString());
		}

		this.channel.send({ embeds: [first] }).then(message => {

			/**
            * The menu message
            * @type {Message}
            */
			this.message = message;

			if(message.channel.permissionsFor(message.guild.me).missing(['SEND_MESSAGES', 'ADD_REACTIONS'])) return message.delete();

			this.addReactions();
			this.createCollector();
		});

	}

	/**
     * Adds reactions to message
     */
	async addReactions() {
		for(const emoji of this.emojis) await this.message.react(emoji);
	}

	/**
     * Creates a reaction collector
     */
	createCollector() {
		const filter = (reaction, user) => (this.emojis.includes(reaction.emoji.name) || this.emojis.includes(reaction.emoji.id)) && user.id === this.memberId;
		const collector = this.message.createReactionCollector(filter, { time: this.timeout });

		collector.on('collect', async reaction => {
			let newPage = this.reactions[reaction.emoji.name] || this.reactions[reaction.emoji.id];
			if(typeof newPage === 'function') newPage = newPage();
			if(newPage) await this.message.edit(newPage);

			await reaction.users.remove(this.memberId);
		});

		collector.on('end', () => {
			this.message.reactions.removeAll();
		});

		this.collector = collector;
	}

	/**
     * Skips to first array interval
     */
	first() {
		if(this.current === 0) return;

		this.current = 0;
		return new MessageEmbed(this.json)
			.setTitle(this.embed.title + ' ' + this.client.utils.getRange(this.array, this.current, this.interval))
			.setDescription(this.array.slice(this.current, this.current + this.interval));
	}

	/**
     * Goes back an array interval
     */
	previous() {
		if(this.current === 0) return;

		this.current -= this.interval;

		if(this.current < 0) this.current = 0;

		return new MessageEmbed(this.json)
			.setTitle(this.embed.title + ' ' + this.client.utils.getRange(this.array, this.current, this.interval))
			.setDescription(this.array.slice(this.current, this.current + this.interval));
	}

	/**
     * Goes to the next array interval
     */
	next() {
		const cap = this.max - (this.max % this.interval);
		if(this.current === cap || this.current + this.interval === this.max) return;
		this.current += this.interval;
		if(this.current >= this.max) this.current = cap;
		const max = (this.current + this.interval >= this.max) ? this.max : this.current + this.interval;
		return new MessageEmbed(this.json)
			.setTitle(this.embed.title + ' ' + this.client.utils.getRange(this.array, this.current, this.interval))
			.setDescription(this.array.slice(this.current, max));
	}

	/**
     * Goes to last array interval
     */
	last() {
		const cap = this.max - (this.max % this.interval);
		if(this.current === cap || this.current + this.interval === this.max) return;
		this.current = cap;
		if(this.current === this.max) this.current -= this.interval;
		return new MessageEmbed(this.json)
			.setTitle(this.embed.title + ' ' + this.client.utils.getRange(this.array, this.current, this.interval))
			.setDescription(this.array.slice(this.current, this.max));
	}

	/**
     * Stops the collector
     */
	stop() {
		this.collector.stop();
	}
}

module.exports = ReactionMenu;