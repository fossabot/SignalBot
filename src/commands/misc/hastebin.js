const Command = require('../../structures/Command');
const { success } = require('../../utils/emojis');
const fetch = require('node-fetch');
const SignalEmbed = require('../../structures/SignalEmbed');

module.exports = class HastebinCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'hastebin',
			usage: 'hastebin <text>',
			aliases: ['pastebin', 'bin'],
			description: 'Uploads the text provided into a hastebin',
			type: client.types.MISC,
			examples: ['hastebin hi', 'pastebin no', 'bin ive written over 100 examples 🎉'],
			guilds: ['GLOBAL'],
		});
	}
	async run(message, args) {
		if (!args[0]) return this.sendErrorMessage(message, 0, 'Please provide a message to upload');

		const content = args.join(' ');
		try {
			const res = await fetch('https://hastebin.com/documents', {
				method: 'POST',
				body: content,
				headers: { 'Content-Type': 'text/plain' },
			});

			const json = await res.json();
			if(!json.key) {
				return this.sendErrorMessage(message, 1, 'Please try again in a few seconds');
			}
			const url = 'https://hastebin.com/' + json.key + '.js';

			const embed = new SignalEmbed(message)
				.setTitle(`${success} Hastebin Created`)
				.setDescription(url);

			message.reply({ embeds: [embed] });
		}
		catch(err) {
			message.client.logger.error(err.stack);
			return this.sendErrorMessage(message, 1, 'Please try again in a few seconds', err.message);
		}
	}

	async slashRun(interaction, args) {
		const content = args.get('message').value;
		try {
			const res = await fetch('https://hastebin.com/documents', {
				method: 'POST',
				body: content,
				headers: { 'Content-Type': 'text/plain' },
			});

			const json = await res.json();
			if(!json.key) {
				return this.sendErrorMessage(interaction, 1, 'Please try again in a few seconds');
			}
			const url = 'https://hastebin.com/' + json.key + '.js';

			const embed = new SignalEmbed(interaction)
				.setTitle(`${success} Hastebin Created`)
				.setDescription(url);

			interaction.reply({ embeds: [embed], ephemeral: true });
		}
		catch(err) {
			interaction.client.logger.error(err.stack);
			return this.sendErrorMessage(interaction, 1, 'Please try again in a few seconds', err.message);
		}
	}

	generateSlashCommand() {
		return {
			name: this.name,
			description: this.description,
			options: [{
				name: 'message',
				type: 'STRING',
				description: 'Content to upload into the bin',
				required: true,
			}],
		};
	}
};