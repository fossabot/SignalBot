const Command = require('../../structures/Command');
const SignalEmbed = require('../../structures/SignalEmbed');
const { success } = require('../../utils/emojis');

module.exports = class NicknameCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'nickname',
			usage: 'nickname <nickname>',
			aliases: ['changenickname', 'nick', 'nn'],
			description: 'Changes your own nickname to the one specified. The nickname cannot be larger than 32 characters.',
			type: client.types.MISC,
			examples: ['nickname Jeff Bezos', 'changenickname Mike', 'nick Joe Biden', 'nn Trump'],
			clientPermissions: ['EMBED_LINKS', 'MANAGE_NICKNAMES'],
			userPermissions: ['CHANGE_NICKNAME', 'MANAGE_NICKNAMES'],
			guilds: ['GLOBAL'],
			guildOnly: true,
		});
	}
	async run(message, args) {
		if (!args[0]) return this.sendErrorMessage(message, 0, 'Please provide a nickname');
		const nickname = message.content.slice(message.content.indexOf(args[0]), message.content.length);

		if (nickname.length > 32) {return this.sendErrorMessage(message, 0, 'Please ensure the nickname is no larger than 32 characters');}
		else if(message.author.id === message.guild.ownerID) {return this.sendErrorMessage(message, 1, 'Unable to change the nickname of server owner');}
		else {
			try {
				const oldNickname = message.member.nickname || '`None`';
				const nicknameStatus = `${oldNickname} ➔ ${nickname}`;
				await message.member.setNickname(nickname);
				const embed = new SignalEmbed(message)
					.setTitle(`${success} Changed Nickname`)
					.setDescription(`${message.member}'s nickname was successfully updated.`)
					.addField('Member', message.member, true)
					.addField('Nickname', nicknameStatus, true);

				message.reply({ embeds: [embed] });
			}
			catch (err) {
				this.sendErrorMessage(message, 1, 'Please check the role hierarchy', err.message);
			}
		}
	}

	async slashRun(interaction, args) {
		const nickname = args.first()?.value;

		if (nickname.length > 32) {return this.sendErrorMessage(interaction, 0, 'Please ensure the nickname is no larger than 32 characters');}
		else if(interaction.user.id === interaction.guild.ownerID) {return this.sendErrorMessage(interaction, 1, 'Unable to change the nickname of server owner');}
		else {
			try {
				const oldNickname = interaction.member.nickname || '`None`';
				const nicknameStatus = `${oldNickname} ➔ ${nickname}`;
				await interaction.member.setNickname(nickname);
				const embed = new SignalEmbed(interaction)
					.setTitle(`${success} Changed Nickname`)
					.setDescription(`${interaction.member}'s nickname was successfully updated.`)
					.addField('Nickname', nicknameStatus, true);

				interaction.reply({ ephemeral: true, embeds: [embed] });
			}
			catch (err) {
				this.sendErrorMessage(interaction, 1, 'Please check the role hierarchy', err.message);
			}
		}
	}

	generateSlashCommand() {
		return {
			name: this.name,
			description: this.description,
			options: [{
				name: 'nickname',
				type: 'STRING',
				description: 'What do you want your nickname to be updated to',
				required: true,
			}],
		};
	}
};
