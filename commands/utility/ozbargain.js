const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ozbargain')
        .setDescription('Replies with the latest ozbargain deals'),
    async execute(interaction) {
        await axios.get("https://www.ozbargain.com.au/cat/gaming/feed")
            .then(({ data }) => {
                const $ = cheerio.load(data, { xmlMode: true });

                const items = $('item').map((_, el) => {
                    const $el = $(el);
                    const description = $el.find('description').text();
        
                    // Use regex to extract the image URL from the description
                    const imageMatch = description.match(/<img[^>]+src="([^">]+)"/);
                    const imageUrl = imageMatch ? imageMatch[1] : null;

                    return {
                        title: $el.find('title').text(),
                        link: $el.find('link').text(),
                        image: imageUrl
                    };
                }).toArray();

                const embedArray = items.map(item => new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(item.title)
                    .setURL(item.link)
                    .setAuthor({ name: 'ozbargain', iconURL: 'https://www.ozbargain.com.au/wiki/lib/exe/fetch.php?hash=0cce44&w=200&media=https%3A%2F%2Ffiles.delvu.com%2Fimages%2Fozbargain%2Flogo%2FSquare%2520Flat.png', url: 'https://www.ozbargain.com.au/'})
                    .setThumbnail(item.image)
                    .setTimestamp()
                    .setFooter({ text: 'DealBot, made by BlueOrcaz', iconURL: 'https://t4.ftcdn.net/jpg/05/21/61/77/360_F_521617788_tW8J94DiIAr3L26zND5RzcwxrCpJcOrt.jpg' })
                );

                const batchSize = 3;
                let currentIndex = 0;

                const generateButtons = (index) => {
                    return new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('prev')
                                .setLabel('Previous')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(index === 0),
                            new ButtonBuilder()
                                .setCustomId('next')
                                .setLabel('Next')
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(index + batchSize >= embedArray.length)
                        );
                };

                const sendEmbeds = async (index) => {
                    const embeds = embedArray.slice(index, index + batchSize);
                    const buttons = generateButtons(index);
                    interaction.editReply({
                        embeds,
                        components: [buttons]
                    });
                };

                // Initial reply
                interaction.reply({
                    content: "ok sigma, here are gaming deals on ozbargain dis week!!!",
                    embeds: embedArray.slice(0, batchSize),
                    components: [generateButtons(0)]
                });

                // Collector to handle button interactions
                const filter = i => i.user.id === interaction.user.id;
                const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

                collector.on('collect', async i => {
                    if (i.customId === 'prev') {
                        currentIndex -= batchSize;
                    } else if (i.customId === 'next') {
                        currentIndex += batchSize;
                    }
                    await sendEmbeds(currentIndex);
                    await i.deferUpdate();
                });

                collector.on('end', async () => {
                    await interaction.editReply({ components: [] });
                });
            });
    }
};