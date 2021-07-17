const Command = require('../../structures/Command');
const SignalEmbed = require('../../structures/SignalEmbed');
const { store } = require('../../utils/emojis.js');

module.exports = class TagCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'tag',
			usage: 'tag <create | list | show | delete | edit | guide>',
			aliases: ['tags'],
			description: 'Creates/Lists/Shows/Edits/Deletes a tag (run s!tags guide for more information)',
			type: client.types.TAG,
			examples: ['tag create', 'tag show cheeze', 'tage delete cheeze', 'tag edit cheeze', 'tag guide'],
			clientPermissions: ['EMBED_LINKS'],
			guilds: ['GLOBAL'],
			guildOnly: true,
		});
	}
	async run(message, args) {
		if(!args[0]) return this.sendErrorMessage(message, 0, 'Please specify a sub command (create, show, delete, edit or guide)');
		if(!['create', 'edit', 'show', 'delete', 'guide', 'list'].includes(args[0].toLowerCase())) return this.sendErrorMessage(message, 0, 'Please specify a valid sub command (create, show, delete, edit or guide)');

		switch(args[0].toLowerCase()) {
		case 'guide': {
			const embed = new SignalEmbed(message)
				.setTitle(':green_book: Guide')
				.setDescription('To see how to use the tag system, view the guide [here](https://github.com/PenPow/SignalBot/wiki/Tag-System)');

			message.reply({ embeds: [embed] });
			break;
		}
		case 'show': {
			if(args[1]) {
				await this.client.db.ensure(`guild_tags_${message.guild.id}`, []);
				const tags = this.client.tags.get(message.guild.id);

				if(!tags) {
					const embed = new SignalEmbed(message)
						.setTitle(`${store} No Tags Found`)
						.setDescription('There are no tags in this server');
					return message.reply({ embeds: [embed] });
				}

				for(let i = 0; i < tags.length; i++) {
					if(tags[i].name.toLowerCase() === args[1].toLowerCase()) {
						return message.reply({ content: tags[i].content });
					}
				}

				const embed = new SignalEmbed(message)
					.setTitle(`${store} No Tag Found`)
					.setDescription(`There are no tags in this server named \`${args[1]}\``);
				return message.reply({ embeds: [embed] });
			}
			else {
				const embed = new SignalEmbed(message)
					.setTitle(`${store} What Tag to Search For`)
					.setDescription('Alright! What tag do you want to search for');

				await message.reply({ embeds: [embed] });

				const filter = (response) => response.author.id === message.author.id;
				message.channel.awaitMessages({ filter, max: 1, time: 120000, errors: ['time'] })
					.then(async (collected) => {
						await this.client.db.ensure(`guild_tags_${message.guild.id}`, []);
						const tags = this.client.tags.get(message.guild.id);

						if(!tags) {
							embed.setTitle(`${store} No Tags Found`)
								.setDescription('There are no tags in this server');
							return message.reply({ embeds: [embed] });
						}

						for(let i = 0; i < tags.length; i++) {
							if(tags[i].name.toLowerCase() === collected.first().content.toLowerCase()) {
								return message.reply({ content: tags[i].content });
							}
						}

						embed.setTitle(`${store} No Tag Found`)
							.setDescription(`There are no tags in this server named \`${collected.first().content}\``);
						return message.reply({ embeds: [embed] });
					});
			}
			break;
		}
		case 'create': {
			const embed = new SignalEmbed(message)
				.setTitle(`${store} Creating a New Tag (1/3)`)
				.setDescription('Alright! Lets create a new tag together, I am going to be walking you through the process of making a new tag, firstly, please enter the name of the tag used to access it! This prompt will expire in two minutes. Due to discord restrictions, your tag cannot have spaces in the name, Signal will replace all spaces with hyphens.');

			await message.reply({ embeds: [embed] });

			const filter = (response) => response.author.id === message.author.id;
			message.channel.awaitMessages({ filter, max: 1, time: 120000, errors: ['time'] })
				.then(async (collected) => {
					embed.setTitle(`${store} Creating a New Tag (2/3)`)
						.setDescription(`Great, your tag will be accessible through \`${this.client.db.get(`${message.guild.id}_prefix`)}${collected.first().content.replace(/ /g, '-').toLowerCase()}\`\n\nNow, we need to specify the content for the tag, write out the content of the tag. This prompt will expire in two minutes.`);

					await message.reply({ embeds: [embed] });
					message.channel.awaitMessages({ filter, max: 1, time: 120000, errors: ['time'] })
						.then(async (collected2) => {
							if(!this.client.db.includes('guild_tags', message.guild.id)) this.client.db.push('guild_tags', message.guild.id);

							await this.client.db.ensure(`guild_tags_${message.guild.id}`, []);
							const tags = this.client.db.get(`guild_tags_${message.guild.id}`);

							for(let i = 0; i < tags.length; i++) {
								if(tags[i].name.toLowerCase() === collected.first().content.replace(/ /g, '-').toLowerCase()) {
									embed.setTitle(`${store} Tag Already Exists`)
										.setDescription('A tag with this name already exists, consider modifying it');

									await message.reply({ embeds: [embed] });

									return;
								}
							}

							this.client.db.push(`guild_tags_${message.guild.id}`, { name: collected.first().content.replace(/ /g, '-').toLowerCase(), content: collected2.first().content });

							tags.push({ name: collected.first().content.replace(/ /g, '-').toLowerCase(), content: collected2.first().content });
							this.client.tags.set(message.guild.id, tags);
							embed.setTitle(`${store} Creating a New Tag (3/3)`)
								.setDescription(`Tag Successfully Created, access it through \`${this.client.db.get(`${message.guild.id}_prefix`)}${collected.first().content.replace(/ /g, '-').toLowerCase()}\``);

							await message.reply({ embeds: [embed] });
						})
						.catch(async () => {
							embed.setTitle(`${store} Expired`)
								.setDescription('Prompt Expired');

							await message.reply({ embeds: [embed] });
						});
				})
				.catch(async () => {
					embed.setTitle(`${store} Expired`)
						.setDescription('Prompt Expired');

					await message.reply({ embeds: [embed] });
				});

			break;
		}
		}
	}

	async slashRun(interaction) {

	}

	generateSlashCommand() {
		return {
			name: this.name,
			description: this.description,
			options: [{
				name: 'create',
				type: 'SUB_COMMAND',
				description: 'Creates a new tag',
			},
			{
				name: 'show',
				type: 'SUB_COMMAND',
				description: 'Shows an existing tag',
			},
			{
				name: 'edit',
				type: 'SUB_COMMAND',
				description: 'Edits a tag',
			},
			{
				name: 'delete',
				type: 'SUB_COMMAND',
				description: 'Deletes a tag',
			},
			{
				name: 'guide',
				type: 'SUB_COMMAND',
				description: 'Shows the guide regarding tags',
			}],
		};
	}
};