const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
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
                
                const embedArray = [];
                const batchSize = 10;
                //console.log(items.length);

                for(let i = 0; i < items.length; i++) {
                    const embed = new EmbedBuilder()
                    .setColor(0x0099FF)
                    .setTitle(`${items[i]["title"]}`)
                    .setURL(`${items[i]["link"]}`)
                    .setAuthor({ name: 'ozbargain', iconURL: 'https://www.ozbargain.com.au/wiki/lib/exe/fetch.php?hash=0cce44&w=200&media=https%3A%2F%2Ffiles.delvu.com%2Fimages%2Fozbargain%2Flogo%2FSquare%2520Flat.png', url: 'https://www.ozbargain.com.au/'})
                    .setThumbnail(`${items[i]["image"]}`)
                    .setTimestamp()
                    .setFooter({ text: 'DealBot, made by BlueOrcaz', iconURL: 'https://t4.ftcdn.net/jpg/05/21/61/77/360_F_521617788_tW8J94DiIAr3L26zND5RzcwxrCpJcOrt.jpg' });
                    embedArray.push(embed);
                }


                const sendEmbedsInBatches = async (interaction, embeds) => {
                    const batchCount = Math.ceil(embeds.length / batchSize);
                    
                    // Reply initially
                    await interaction.reply({
                        content: "ok sigma, here are gaming deals on ozbargain dis week!!!",
                        embeds: embeds.slice(0, batchSize)
                    });
                
                    // Send remaining embeds in follow-ups
                    for (let i = 1; i < batchCount; i++) {
                        const start = i * batchSize;
                        const end = start + batchSize;
                        const batch = embeds.slice(start, end);
                
                        await interaction.followUp({
                            embeds: batch
                        });
                
                        // Delay between batches to avoid hitting rate limits
                        if (i < batchCount - 1) {
                            await new Promise(resolve => setTimeout(resolve, 2000)); // 2 seconds delay
                        }
                    }
                };
                
                
                // Send the embeds
                sendEmbedsInBatches(interaction, embedArray);
            });
    }
}