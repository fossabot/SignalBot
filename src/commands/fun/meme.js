const Command = require('../../structures/Command');
const SignalEmbed = require('../../structures/SignalEmbed');

const { fun } = require('../../utils/emojis.js');

const fetch = require('node-fetch');

module.exports = class MemeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'meme',
			usage: 'meme',
			// aliases: ['foxpic'],
			description: 'Finds a random meme',
			type: client.types.FUN,
			examples: ['meme'],
			clientPermissions: ['EMBED_LINKS'],
			guilds: ['GLOBAL'],
		});
	}
	async run(message) {
		try {
			const res = await fetch('https://meme-api.herokuapp.com/gimme');
			const jsonres = await res.json();

			const embed = new SignalEmbed(message)
				.setTitle(`${fun} ${jsonres.title} (r/${jsonres.subreddit})`)
				.setURL(jsonres.postLink)
				.setImage(jsonres.url);

			message.reply({ embeds: [embed] });
		}
		catch(err) {
			message.client.logger.error(err.stack);
			this.sendErrorMessage(message, 1, 'Please try again in a few seconds', err.message);
		}
	}

	async slashRun(interaction) {
		try {
			const res = await fetch('https://meme-api.herokuapp.com/gimme');
			const jsonres = await res.json();

			const embed = new SignalEmbed(interaction)
				.setTitle(`${fun} ${jsonres.title} (r/${jsonres.subreddit})`)
				.setURL(jsonres.postLink)
				.setImage(jsonres.url);

			interaction.reply({ ephemeral: true, embeds: [embed] });
		}
		catch(err) {
			interaction.client.logger.error(err.stack);
			this.sendErrorMessage(interaction, 1, 'Please try again in a few seconds', err.message);
		}
	}

	generateSlashCommand() {
		return {
			name: this.name,
			description: this.description,
		};
	}
};