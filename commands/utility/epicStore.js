const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('epicstore')
        .setDescription('Returns all the free games this week'),
        async execute(interaction) {
            await axios.get('https://store-site-backend-static.ak.epicgames.com/freeGamesPromotions')
            .then(function (response) {
                // filter out games coz some of them are not fully discounted
                const elements = response.data.data.Catalog.searchStore.elements;
                const freeGames = elements.filter(
                    (e) =>
                        e.promotions?.promotionalOffers[0]?.promotionalOffers[0]
                            ?.discountSetting?.discountPercentage == 0
                );

                const embedArray = []; // multiple embeds in omessage
                for(let i = 0; i < freeGames.length; i++) {
                    const gameId = freeGames[i].catalogNs?.mappings[0]?.pageSlug || freeGames[i].productSlug;
                    const url = "https://store.epicgames.com/p/" + gameId;
                    const endDate = freeGames[i].promotions?.promotionalOffers[0]?.promotionalOffers[0]?.endDate;
                    const convertedDate = new Date(endDate).getTime() / 1000;
                    const originalprice = freeGames[i]["price"]["totalPrice"]["fmtPrice"]["originalPrice"];
                    const embed = new EmbedBuilder()
                        .setColor(0x0099FF)
                        .setTitle(`${freeGames[i]["title"]}`)
                        .setURL(url)
                        .setAuthor({ name: 'Epic Games Store', iconURL: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Epic_Games_logo.svg/516px-Epic_Games_logo.svg.png', url: 'https://store.epicgames.com/' })
                        .setDescription(`${freeGames[i]["description"]}`)
                        .setThumbnail(`${freeGames[i]["keyImages"][0]["url"]}`)
                        .addFields(
                            { name: 'Original Price:', value: `${originalprice} USD` },
                            { name: 'Discounted Price:', value: "Free" },
                            { name: 'Deal Ends on:', value: `<t:${convertedDate}:F>`}
                        )
                        .setTimestamp()
                        .setFooter({ text: 'sigma deals bot, made by BlueOrcaz', iconURL: 'https://t4.ftcdn.net/jpg/05/21/61/77/360_F_521617788_tW8J94DiIAr3L26zND5RzcwxrCpJcOrt.jpg' });
                    embedArray.push(embed);
                }
                interaction.reply({ content: "ok sigma, here are free games on epic for dis week!!!" , embeds: embedArray});
            });
            
        }
}