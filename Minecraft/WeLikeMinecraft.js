const enchantmentsList = require('./enchantments.json');
const playerSaveData = require('./playerSaveData.json');
const pickaxesList = require('./pickaxes.json');
const fs = require('fs');

class Minecraft {
    constructor() {
        this.afkTime = 30000
        this.picks = pickaxesList;
        this.enchants = enchantmentsList;
        this.saveData = playerSaveData;
        this.activePlayers = new Map();
        this.playerStates = new Map();
        this.activeChannel = new Map();
        this.exampleResponses = [];
        this.validStates = [ //Currently unused, was made to help keep sanity.
            "Getting Help",
            "Help Escape",
            "Selecting Pick",
            "Crafting",
            "Smelting",
            "Smelting Iron",
            "Smelting Gold",
            "Enchanting",
            "Enchanting Helmet",
            "Enchanting Chestplate",
            "Enchanting Leggings",
            "Enchanting Boots",
            "Enchanting Pick",
            "Enchanting Sword",
            "Equipping",
            "Equipping Helmet",
            "Equipping Chestplate",
            "Equipping Leggings",
            "Equipping Boots",
            "Equipping Sword",
            "Displaying Inventory",
            "Confirming End Fight",
            "Destroying",
            "Destroying Pick",
            "Destroying Helmet",
            "Destroying Chestplate",
            "Destroying Leggings",
            "Destroying Boots",
            "Destroying Sword"
        ];
    }
    main(msg) {
        this.updateSaveData(msg);
        this.load();
        this.playerActive(msg);
        this.playerStates.delete(msg.author.id);
        this.activeChannel.set(msg.author.id, msg.channel.id);
        let message = '';
        if (!this.saveData.players.some(player => player.id === msg.author.id)) {
            this.addMiner(msg);
            message += `Welcome to the game ${msg.author.username}!\n`;
        }
        else {
            message += `Welcome back ${msg.author.username}.\n`;
        }
        this.exampleResponses = ['Mine', 'Craft', 'Smelt', 'Enchant', 'Equip', 'Inventory', 'Loadout', 'Destroy', 'End', 'Stats', 'Help']
        message += `Reply with what you want to do.\nExpected responses are ${this.exampleResponses.join(', ')}. You can respond "Stop" at any time to get out of the game/whatever you are doing.`
        this.save(this.saveData);
        msg.channel.send(message);
    }
    responses(msg) {
        this.updateSaveData(msg);
        let str = msg.content.toLowerCase()
        if (str.startsWith('stop') && this.playerStates.get(msg.author.id) !== "Getting Help") {
            this.forceTimeout(msg);
            return;
        }
        if (!this.playerStates.get(msg.author.id)) {
            this.playerActive(msg);
            if (str.startsWith('mine')) {
                if (this.playerIsMining(msg)) {
                    msg.channel.send(`${msg.author.username}, you are already mining! You will be done in ${this.getDoneTime(msg, 'mine')}. (HH:MM:SS)`);
                }
                else if (this.playerIsSmelting(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently smelting ingots and can't mine. You will be done in ${this.getDoneTime(msg, 'smelt')}. (HH:MM:SS)`);
                }
                else if (this.playerIsFighting(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently fighting the end and can't mine. You will be done in ${this.getDoneTime(msg, 'end')}. (HH:MM:SS)`);
                }
                else {
                    this.displayPicks(msg);
                    msg.channel.send(`${msg.author.username}, respond with the number of the pick you'd like to use.`);
                    this.playerStates.set(msg.author.id, "Selecting Pick");
                }
            }
            else if (str.startsWith('craft')) {
                if (this.playerIsMining(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently mining and can't craft anything. You will be done in ${this.getDoneTime(msg, 'mine')}. (HH:MM:SS)`);
                }
                else if (this.playerIsFighting(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently fighting the end and can't craft anything. You will be done in ${this.getDoneTime(msg, 'end')}. (HH:MM:SS)`);
                }
                else {
                    this.exampleResponses = ['Diamond Pick', 'Iron Boots', 'Gold Sword', 'Stone Pick', 'Gold Leggings', 'Iron Pick', 'Diamond Chestplate'];
                    msg.channel.send(`${msg.author.username}, what would you like to craft?\nExample responses are ${this.exampleResponses.join(', ')}.`);
                    this.playerStates.set(msg.author.id, "Crafting");
                }
            }
            else if (str.startsWith('smelt')) {
                if (this.playerIsMining(msg)) {
                    msg.channel.send(`${msg.author.username}, you are mining and unable to smelt anything. You will be done in ${this.getDoneTime(msg, 'mine')}. (HH:MM:SS)`);
                }
                else if (this.playerIsSmelting(msg)) {
                    msg.channel.send(`${msg.author.username}, you are already smelting. One smelt job at a time please. You will be done in ${this.getDoneTime(msg, 'smelt')}. (HH:MM:SS)`);
                }
                else if (this.playerIsFighting(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently fighting the end and can't smelt anything. You will be done in ${this.getDoneTime(msg, 'end')}. (HH:MM:SS)`);
                }
                else {
                    this.exampleResponses = ['Iron', 'Gold', 'All'];
                    msg.channel.send(`${msg.author.username}, what would you like to smelt?\nExpected responses are ${this.exampleResponses.join(', ')}.`);
                    this.playerStates.set(msg.author.id, "Smelting");
                }
            }
            else if (str.startsWith('enchant')) {
                if (this.playerIsMining(msg)) {
                    msg.channel.send(`${msg.author.username}, you are mining and can't enchant anything. You will be done in ${this.getDoneTime(msg, 'mine')}. (HH:MM:SS)`);
                }
                else if (this.playerIsFighting(msg)) {
                    msg.channel.send(`${msg.author.username}, you care currently fighting the end and can't enchant anything. You will be done in ${this.getDoneTime(msg, 'end')}. (HH:MM:SS)`);
                }
                else {
                    this.exampleResponses = ['Pick', 'Sword', 'Helmet', 'Chestplate', 'Leggings', 'Boots'];
                    msg.channel.send(`${msg.author.username}, what would you like to enchant?\nExpected responses are ${this.exampleResponses.join(', ')}.`);
                    this.playerStates.set(msg.author.id, "Enchanting");
                }
            }
            else if (str.startsWith('equip')) {
                if (this.playerIsMining(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently mining and can't equip new/different equipment. You will be done in ${this.getDoneTime(msg, 'mine')}. (HH:MM:SS)`);
                }
                else if (this.playerIsFighting(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently fighting the end and can't change your equipment. You will be done in ${this.getDoneTime(msg, 'end')}. (HH:MM:SS)`);
                }
                else {
                    this.exampleResponses = ['Sword', 'Helmet', 'Chestplate', 'Leggings', 'Boots'];
                    msg.channel.send(`${msg.author.username}, what would you like to equip?\nExpected responses are ${this.exampleResponses.join(', ')}.`);
                    this.playerStates.set(msg.author.id, "Equipping");
                }
            }
            else if (str.startsWith('inventory')) {
                if (this.playerIsMining(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently mining and can't check your inventory. You will be done in ${this.getDoneTime(msg, 'mine')}. (HH:MM:SS)`);
                }
                else if (this.playerIsFighting(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently fighting the end and can't check your inventory. You will be done in ${this.getDoneTime(msg, 'end')}. (HH:MM:SS)`);
                }
                else {
                    this.exampleResponses = ['Picks', 'Swords', 'Items', 'Helmets', 'Chestplates', 'Leggings', 'Boots'];
                    msg.channel.send(`${msg.author.username}, what inventory would you like to display?\nExpected responses are ${this.exampleResponses.join(', ')}.`);
                    this.playerStates.set(msg.author.id, "Displaying Inventory");
                }
            }
            else if (str.startsWith('loadout')) {
                if (this.playerIsFighting(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently fighting the end and can't check your loadout. You will be done in ${this.getDoneTime(msg, 'end')}. (HH:MM:SS)`);
                    return;
                }
                this.displayEquipped(msg);
            }
            else if (str.startsWith('destroy')) {
                if (this.playerIsMining(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently mining and can't destroy equipment. You will be done in ${this.getDoneTime(msg, 'mine')}. (HH:MM:SS)`);
                }
                else if (this.playerIsFighting(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently fighting the end and can't destroy equipment. You will be done in ${this.getDoneTime(msg, 'end')}. (HH:MM:SS)`);
                }
                else {
                    this.exampleResponses = ['Picks', 'Swords', 'Helmets', 'Chestplates', 'Leggings', 'Boots'];
                    msg.channel.send(`${msg.author.username}, what kind of item would you like to destroy?\nExpected responses are ${this.exampleResponses.join(', ')}.`);
                    this.playerStates.set(msg.author.id, "Destroying");
                }
            }
            else if (str.startsWith('end')) {
                if (this.playerIsMining(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently mining and can't fight the end. You will be done in ${this.getDoneTime(msg, 'mine')}. (HH:MM:SS)`);
                }
                else if (this.playerIsSmelting(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently smelting ingots and can't fight the end. You will be done in ${this.getDoneTime(msg, 'smelt')}. (HH:MM:SS)`);
                }
                else if (this.playerIsFighting(msg)) {
                    msg.channel.send(`${msg.author.username}, you are already fighting the end! You will be done in ${this.getDoneTime(msg, 'end')}. (HH:MM:SS)`);
                }
                else {
                    msg.channel.send(`${msg.author.username}, are you sure you want to attempt the end? (Respond y/n)\nIf you fail, you will lose all equipped items. If you succeed, you will "prestige" and all you data (other than stats) will be reset.`);
                    this.displayEquipped(msg);
                    this.playerStates.set(msg.author.id, "Confirming End Fight");
                }
            }
            else if (str.startsWith('stats')) {
                if (this.playerIsFighting(msg)) {
                    msg.channel.send(`${msg.author.username}, you are currently fighting the end and can't check your stats. You will be done in ${this.getDoneTime(msg, 'end')}. (HH:MM:SS)`);
                    return;
                }
                this.displayStats(msg);
            }
            else if (str.startsWith('help')) {
                this.exampleResponses = ['Mine', 'Craft', 'Smelt', 'Enchant', 'Equip', 'Inventory', 'Loadout', 'Destroy', 'End', 'Stats', 'Stop'];
                msg.channel.send(`${msg.author.username}, what do you need help with?\n${this.exampleResponses.join(', ')}`);
                this.playerStates.set(msg.author.id, "Getting Help");
            }
            else {
                this.unexpectedResponse(msg);
            }
        }
        else if (this.playerStates.get(msg.author.id)) {
            this.playerActive(msg);
            let choice;
            switch (this.playerStates.get(msg.author.id)) {
                case 'Help Escape':
                    this.playerStates.set(msg.author.id, "Getting Help");
                    //INTENTIONALLY MISSING BREAK HERE!!! DO NOT ADD BREAK!!!
                    // logic is that if player tries to escape help with "stop", it will catch it in the *if (str.startsWith('stop') && this.playerStates.get(msg.author.id) !== "Getting Help")*
                    // and remove state and we won't even get here, but if they don't want to escape help, we want to put them back into getting help state and run the getting help case.
                case 'Getting Help':
                    this.exampleResponses = ['Mine', 'Craft', 'Smelt', 'Enchant', 'Equip', 'Inventory', 'Loadout', 'Destroy', 'End', 'Stats', 'Stop'];
                    if (str.startsWith('mine')) {
                        msg.channel.send(`**Mine**: how to get materials. It will display your available picks and you can respond with the corresponding number to use that pick.\n\nDo you need help with anything else?\n${this.exampleResponses.join(', ')}`);
                    }
                    else if (str.startsWith('craft')) {
                        msg.channel.send(`**Craft**: how to make picks, swords, and armor. You respond with what you want to make.\n\nDo you need help with anything else?\n${this.exampleResponses.join(', ')}`);
                    }
                    else if (str.startsWith('smelt')) {
                        msg.channel.send(`**Smelt**: how to get iron and gold ingots. Expected responses are "Gold", "Iron", or "All"\n\t*Gold*: Chooses gold to smelt. You then respond with a number or "All".\n\t*Iron*: Chooses iron to smelt. You then respond with a number or "All".\n\t*All*: Attempts to smelt all iron and gold ingots you have.\n\nDo you need help with anything else?\n${this.exampleResponses.join(', ')}`);
                    }
                    else if (str.startsWith('enchant')) {
                        msg.channel.send(`**Enchant**: How to enchant your equipment. Requires experience, which you get from mining and smelting. Respond with what kind of equipment you'd like to enchant, and then the corresponding number to that item.\n\nDo you need help with anyting else?\n${this.exampleResponses.join(', ')}`);
                    }
                    else if (str.startsWith('equip')) {
                        msg.channel.send(`**Equip**: How to equip your sword and armor. Respond with what kind of equipment you'd like to equip, and then the corresponding number to that item.\n\nDo you need help with anything else?\n${this.exampleResponses.join(', ')}`);
                    }
                    else if (str.startsWith('inventory')) {
                        msg.channel.send(`**Inventory**: Allows you to see your inventory. Expected responses are "Picks", "Swords", "Items", "Helmets", "Chestplates", "Leggings", or "Boots".\n\nDo you need help with anything else?\n${this.exampleResponses.join(', ')}`);
                    }
                    else if (str.startsWith('loadout')) {
                        msg.channel.send(`**Loadout**: Displays your currently equipped sword and armor.\n\nDo you need help with anything else?\n${this.exampleResponses.join(', ')}`);
                    }
                    else if (str.startsWith('destroy')) {
                        msg.channel.send(`**Destroy**: How to remove picks/swords/armor from your inventory, since you can only have 5 of each.\nExpected responses are "Picks", "Swords", "Helmets", "Leggings", or "Boots".\n\nDo you need help with anything else?\n${this.exampleResponses.join(', ')}`);
                    }
                    else if (str.startsWith('end')) {
                        msg.channel.send(`**End**: How to fight the end dragon and "win the game". Respond with y/n for confirmation.\n\nDo you need help with anything else?\n${this.exampleResponses.join(', ')}`);
                    }
                    else if (str.startsWith('stats')) {
                        msg.channel.send(`**Stats**: Allows you to see how many times you beat the end.\n\nDo you need help with anything else?\n${this.exampleResponses.join(', ')}`);
                    }
                    else if (str.startsWith('stop')) {
                        msg.channel.send(`**Stop**: Exits you from actively playing. Rejoin with "m.mine".\n\nDo you need help with anything else?\n${this.exampleResponses.join(', ')}\n(To actually stop respond with "Stop" again.)`);
                        this.playerStates.set(msg.author.id, "Help Escape");
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Selecting Pick':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        this.mine(msg, choice - 1);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Crafting':
                    str = str.split(' ');
                    if (str.length === 2) {
                        this.craft(msg, str[0], str[1]);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Smelting':
                    if (str.startsWith('all')) {
                        this.smelt(msg, 'all', 'all');
                    }
                    else if (str.startsWith('iron')) {
                        msg.channel.send(`${msg.author.username}, how much Iron would you like to smelt? Respond with a number or "all".`);
                        this.playerStates.set(msg.author.id, "Smelting Iron");
                    }
                    else if (str.startsWith('gold')) {
                        msg.channel.send(`${msg.author.username}, how much Gold would you like to smelt? Respond with a number or "all".`);
                        this.playerStates.set(msg.author.id, "Smelting Gold");
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Smelting Iron':
                    if (!isNaN(parseInt(str))) {
                        this.smelt(msg, 'Iron', parseInt(str));
                    }
                    else if (str.startsWith('all')) {
                        this.smelt(msg, 'Iron', 'all');
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Smelting Gold':
                    if (!isNaN(parseInt(str))) {
                        this.smelt(msg, 'Gold', parseInt(str));
                    }
                    else if (str.startsWith('all')) {
                        this.smelt(msg, 'Gold', 'all');
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Enchanting':
                    if (str.startsWith('pick')) {
                        msg.channel.send(`${msg.author.username}, respond with the number of the pick you'd like to enchant.`);
                        this.displayPicks(msg);
                        this.playerStates.set(msg.author.id, "Enchanting Pick");
                    }
                    else if (str.startsWith('sword')) {
                        msg.channel.send(`${msg.author.username}, respond with the number of the sword you'd like to enchant.`);
                        this.displaySwords(msg);
                        this.playerStates.set(msg.author.id, "Enchanting Sword");
                    }
                    else if (str.startsWith('helmet')) {
                        msg.channel.send(`${msg.author.username}, respond with the number of the helmet you'd like to enchant.`);
                        this.displayHelmets(msg);
                        this.playerStates.set(msg.author.id, "Enchanting Helmet");
                    }
                    else if (str.startsWith('chestplate')) {
                        msg.channel.send(`${msg.author.username}, respond with the number of the chestplate you'd like to enchant.`);
                        this.displayChestplates(msg);
                        this.playerStates.set(msg.author.id, "Enchanting Chestplate");
                    }
                    else if (str.startsWith('leggings')) {
                        msg.channel.send(`${msg.author.username}, respond with the number of the leggings you'd like to enchant.`);
                        this.displayLeggings(msg);
                        this.playerStates.set(msg.author.id, "Enchanting Leggings");
                    }
                    else if (str.startsWith('boots')) {
                        msg.channel.send(`${msg.author.username}, respond with the number of the boots you'd like to enchant.`);
                        this.displayBoots(msg);
                        this.playerStates.set(msg.author.id, "Enchanting Boots");
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Enchanting Helmet':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        //TODO this.enchant(msg, 'Helmet', choice - 1);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Enchanting Chestplate':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        //TODO this.enchant(msg, 'Chestplate', choice - 1);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Enchanting Leggings':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        //TODO this.enchant(msg, 'Leggings', choice - 1);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Enchanting Boots':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        //TODO this.enchant(msg, 'Boots', choice - 1);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Enchanting Pick':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        //TODO this.enchant(msg, 'Pick', choice - 1);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Enchanting Sword':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        //TODO this.enchant(msg, 'Sword', choice - 1);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Equipping':
                    if (str.startsWith('helmet')) {
                        msg.channel.send(`${msg.author.username}, respond with the number of the helmet you'd like to equip.`);
                        this.displayHelmets(msg);
                        this.playerStates.set(msg.author.id, "Equipping Helmet");
                    }
                    else if (str.startsWith('chestplate')) {
                        msg.channel.send(`${msg.author.username}, respond with the number of the chestplate you'd like to equip.`);
                        this.displayChestplates(msg);
                        this.playerStates.set(msg.author.id, "Equipping Chestplate");
                    }
                    else if (str.startsWith('leggings')) {
                        msg.channel.send(`${msg.author.username}, respond with the number of the leggings you'd like to equip.`);
                        this.displayLeggings(msg);
                        this.playerStates.set(msg.author.id, "Equipping Leggings");
                    }
                    else if (str.startsWith('boots')) {
                        msg.channel.send(`${msg.author.username}, respond with the number of the boots you'd like to equip.`);
                        this.displayBoots(msg);
                        this.playerStates.set(msg.author.id, "Equipping Boots");
                    }
                    else if (str.startsWith('sword')) {
                        msg.channel.send(`${msg.author.username}, respond with the number of the boots you'd like to equip.`);
                        this.displaySwords(msg);
                        this.playerStates.set(msg.author.id, "Equipping Sword");
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Equipping Helmet':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        this.equip(msg, 'Helmet', choice - 1);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Equipping Chestplate':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        this.equip(msg, 'Chestplate', choice - 1);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Equipping Leggings':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        this.equip(msg, 'Leggings', choice - 1);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Equipping Boots':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        this.equip(msg, 'Boots', choice - 1);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Equipping Sword':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        this.equip(msg, 'Sword', choice - 1);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Displaying Inventory':
                    if (str.startsWith('picks')) {
                        this.displayPicks(msg);
                        this.playerStates.delete(msg.author.id);
                    }
                    else if (str.startsWith('swords')) {
                        this.displaySwords(msg);
                        this.playerStates.delete(msg.author.id);
                    }
                    else if (str.startsWith('items')) {
                        this.displayItems(msg);
                        this.playerStates.delete(msg.author.id);
                    }
                    else if (str.startsWith('helmets')) {
                        this.displayHelmets(msg);
                        this.playerStates.delete(msg.author.id);
                    }
                    else if (str.startsWith('chestplates')) {
                        this.displayChestplates(msg);
                        this.playerStates.delete(msg.author.id);
                    }
                    else if (str.startsWith('leggings')) {
                        this.displayLeggings(msg);
                        this.playerStates.delete(msg.author.id);
                    }
                    else if (str.startsWith('boots')) {
                        this.displayBoots(msg);
                        this.playerStates.delete(msg.author.id);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Confirming End Fight':
                    if (str.startsWith('y')) {
                        //TODO this.endFight(msg)
                        this.playerStates.delete(msg.author.id);
                        msg.react('✅');
                        msg.channel.send(`${msg.author.username}, you are now fighting to save the end, you will be done in ${this.getDoneTime(msg, 'end')}. (HH:MM:SS)`);
                    }
                    else if (str.startsWith('n')) {
                        this.playerStates.delete(msg.author.id);
                        msg.react('🐔');
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Destroying':
                    if (str.startsWith('pick')) {
                        this.displayPicks(msg);
                        msg.channel.send(`${msg.author.username}, which Pickaxe would you like to destroy? Respond with the corresponding number.`);
                        this.playerStates.set(msg.author.id, "Destroying Pick");
                    }
                    else if (str.startsWith('sword')) {
                        this.displaySwords(msg);
                        msg.channel.send(`${msg.author.username}, which Sword would you like to destroy? Respond with the corresponding number.`);
                        this.playerStates.set(msg.author.id, "Destroying Sword");
                    }
                    else if (str.startsWith('helmet')) {
                        this.displayHelmets(msg);
                        msg.channel.send(`${msg.author.username}, which Helmet would you like to destroy? Respond with the corresponding number.`);
                        this.playerStates.set(msg.author.id, "Destroying Helmet");
                    }
                    else if (str.startsWith('chestplate')) {
                        this.displayChestplates(msg);
                        msg.channel.send(`${msg.author.username}, which Chestplate would you like to destroy? Respond with the corresponding number.`);
                        this.playerStates.set(msg.author.id, "Destroying Chestplate");
                    }
                    else if (str.startsWith('leggings')) {
                        this.displayLeggings(msg);
                        msg.channel.send(`${msg.author.username}, which Leggings would you like to destroy? Respond with the corresponding number.`);
                        this.playerStates.set(msg.author.id, "Destroying Leggings");
                    }
                    else if (str.startsWith('boots')) {
                        this.displayBoots(msg);
                        msg.channel.send(`${msg.author.username}, which Boots would you like to destroy? Respond with the correstponding number.`);
                        this.playerStates.set(msg.author.id, "Destroying Boots");
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Destroying Pick':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        this.destroy(msg, 'Pick', choice - 1);
                        this.playerStates.delete(msg.author.id);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Destroying Helmet':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        this.destroy(msg, 'Helmet', choice - 1);
                        this.playerStates.delete(msg.author.id);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Destroying Chestplate':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        this.destroy(msg, 'Chestplate', choice - 1);
                        this.playerStates.delete(msg.author.id);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Destroying Leggings':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        this.destroy(msg, 'Leggings', choice - 1);
                        this.playerStates.delete(msg.author.id);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Destroying Boots':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        this.destroy(msg, 'Boots', choice - 1);
                        this.playerStates.delete(msg.author.id);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
                case 'Destroying Sword':
                    choice = parseInt(str);
                    if (!isNaN(choice)) {
                        this.destroy(msg, 'Sword', choice - 1);
                        this.playerStates.delete(msg.author.id);
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                    break;
            }
        }
    }
    unexpectedResponse(msg) {
        msg.channel.send(`${msg.author.username}: unexpected response, try again.`); //Literally typed this out 13 times before making it a fn......
    }
    load() {
        this.saveData = JSON.parse(fs.readFileSync('./Minecraft/playerSaveData.json'));
        return;
    }
    save(data) {
        fs.writeFileSync('./Minecraft/playerSaveData.json', JSON.stringify(data, null, 4));
        return;
    }
    updateSaveData(msg) {
        if (this.playerIsMining(msg)) return;
        if (this.playerIsSmelting(msg)) return;
        if (this.playerIsFighting(msg)) return;
        this.load()
        let temp = this.saveData;
        let index = temp.players.findIndex((player) => player.id === msg.author.id)
        if (index === -1) return;
        if (!Object.values(temp.players[index].temp_inventory).some((value) => value > 0)) return;
        temp.players[index].exp += temp.players[index].temp_inventory.exp;
        temp.players[index].inventory.cobblestone += temp.players[index].temp_inventory.cobblestone;
        temp.players[index].inventory.iron_ore += temp.players[index].temp_inventory.iron_ore;
        temp.players[index].inventory.iron_ingot += temp.players[index].temp_inventory.iron_ingot;
        temp.players[index].inventory.diamond += temp.players[index].temp_inventory.diamond;
        temp.players[index].inventory.gold_ore += temp.players[index].temp_inventory.gold_ore;
        temp.players[index].inventory.gold_ingot += temp.players[index].temp_inventory.gold_ingot;
        temp.players[index].inventory.coal += temp.players[index].temp_inventory.coal;
        temp.players[index].inventory.lapis += temp.players[index].temp_inventory.lapis;
        temp.players[index].temp_inventory.exp = 0;
        temp.players[index].temp_inventory.cobblestone = 0;
        temp.players[index].temp_inventory.iron_ore = 0;
        temp.players[index].temp_inventory.iron_ingot = 0;
        temp.players[index].temp_inventory.diamond = 0;
        temp.players[index].temp_inventory.gold_ore = 0;
        temp.players[index].temp_inventory.gold_ingot = 0;
        temp.players[index].temp_inventory.coal = 0;
        temp.players[index].temp_inventory.lapis = 0;
    this.save(temp);
    }
    playerActive(msg) {
        if (this.activePlayers.get(msg.author.id)) {
            clearTimeout(this.activePlayers.get(msg.author.id));
        }
        let newId = setTimeout(() => {this.timedout(msg)}, this.afkTime);
        this.activePlayers.set(msg.author.id, newId);
        return;
    }
    timedout(msg) {
        this.activePlayers.delete(msg.author.id);
        this.playerStates.delete(msg.author.id);
        msg.channel.send(`${msg.author.username} timed out.`);
        return;
    }
    forceTimeout(msg) {
        clearTimeout(this.activePlayers.get(msg.author.id));
        this.activePlayers.delete(msg.author.id);
        this.playerStates.delete(msg.author.id);
        msg.channel.send(`${msg.author.username} stopped playing (for now).`);
        return;
    }
    addMiner(msg) {
        this.saveData.players.push({
            id: msg.author.id,
            name: msg.author.username,
            difficulty: 'Normal',
            normal_clears: 0,
            normal_attempts: 0,
            hardcore_clears: 0,
            hardcore_attempts: 0,
            exp: 0,
            mineTimeEnd: 0,
            smeltTimeEnd: 0,
            endFightTimeEnd: 0,
            inventory: {
                cobblestone: 0,
                iron_ore: 0,
                iron_ingot: 0,
                diamond: 0,
                gold_ore: 0,
                gold_ingot: 0,
                coal: 0,
                lapis: 0,
                picks: [
                    {
                        type: 'Wood',
                        enchants:[]                    
                    }
                ],
                helmets: [],
                chestplates: [],
                leggings: [],
                boots: [],
                swords: []
            },
            temp_inventory :{
                exp: 0,
                cobblestone: 0,
                iron_ore: 0,
                iron_ingot: 0,
                diamond: 0,
                gold_ore: 0,
                gold_ingot: 0,
                coal: 0,
                lapis: 0
            }
        });
        return;
    }
    getDoneTime(msg, activity) {
        this.load()
        for (const player of this.saveData.players) {
            if (player.id === msg.author.id) {
                switch (activity) {
                    case 'mine': 
                        return this.convertTime(player.mineTimeEnd - Date.now());
                    case 'smelt':
                        return this.convertTime(player.smeltTimeEnd - Date.now());
                    case 'end':
                        return this.convertTime(player.endFightTimeEnd - Date.now());
                }
            }
        }
    }
    convertTime(milliseconds) { //Converts milliseconds to HH:MM:SS format
        let hours = 0
        let minutes = 0
        let seconds = 0
        let string = ""
        hours = Math.floor(milliseconds/3600000)
        minutes = Math.floor((milliseconds%3600000)/60000)
        seconds = Math.floor(((milliseconds%3600000)%60000)/1000)
        if (hours < 10) {
            string += `0${hours}:`
        }
        else {
            string += `${hours}:`
        }
        if (minutes < 10) {
            string += `0${minutes}:`
        }
        else {
            string += `${minutes}:`
        }
        if (seconds < 10) {
            string += `0${seconds}`
        }
        else {
            string += `${seconds}`
        }
        return string;
    }
    playerIsMining(msg) {
        this.load();
        for (const player of this.saveData.players) {
            if (player.id === msg.author.id) {
                if (player.mineTimeEnd > Date.now()) return true;
                else return false;
            }
        }
    }
    playerIsSmelting(msg) {
        this.load();
        for (const player of this.saveData.players) {
            if (player.id === msg.author.id) {
                if (player.smeltTimeEnd > Date.now()) return true;
                else return false;
            }
        }
    }
    playerIsFighting(msg) {
        this.load();
        for (const player of this.saveData.players) {
            if (player.id === msg.author.id) {
                if (player.endFightTimeEnd > Date.now()) return true;
                else return false;
            }
        }
    }
    displayPicks(msg) {
        this.load();
        this.saveData.players.forEach((player) => {
            if (player.id === msg.author.id) {
                if (player.inventory.picks.length === 0 && player.inventory.cobblestone < 3 && player.inventory.iron_ingot < 3 && player.inventory.diamond < 3 && player.inventory.gold_ingot < 3 && (player.inventory.coal === 0 || (player.inventory.iron_ore < 3 && player.inventory.gold_ore < 3))) {
                    //Case where you make and delete picks until you cant make new picks
                    msg.channel.send(`${msg.author.username}, it seems you don't have the materials to make a pickaxe...\nHave this spare one I have lying around.`);
                    player.inventory.picks.push({
                        type: 'Wood',
                        enchants: []
                    });
                    this.save(this.saveData);
                    this.displayPicks(msg);
                }
                else if (player.inventory.picks.length === 0) {
                    msg.channel.send(`${msg.author.username}, you don't have any pickaxes! Go craft some!`);
                }
                else {
                    let text = `${msg.author.username}'s picks:\n`;
                    let chants = '';
                    player.inventory.picks.forEach((pick, index) => {
                        if (pick.enchants.length === 0) {
                            chants = 'None';
                        }
                        else {
                            chants = pick.enchants.join(', ');
                        }
                        text += `**${index + 1}**: ${pick.type}\n\tEnchantments: ${chants}\n\n`;
                    });
                    msg.channel.send(text);
                }
            }
        });
    }
    displaySwords(msg) {
        this.load();
        this.saveData.players.forEach((player) => {
            if (player.id === msg.author.id) {
                if (player.inventory.swords.length === 0) {
                    msg.channel.send(`${msg.author.username}, you don't have any swords! Go craft some!`);
                }
                else {
                    let text = `${msg.author.username}'s swords:\n`;
                    let chants = '';
                    player.inventory.swords.forEach((sword, index) => {
                        if (sword.enchants.length === 0) {
                            chants = 'None';
                        }
                        else {
                            chants = sword.enchants.join(', ');
                        }
                        if (sword.equipped) {
                            text += `**${index + 1}**: ${sword.type} *Equipped*\n\tEnchantments: ${chants}\n\n`;
                        }
                        else {
                            text += `**${index + 1}**: ${sword.type}\n\tEnchantments: ${chants}\n\n`;
                        }
                    });
                    msg.channel.send(text);
                }
            }
        });
    }
    displayHelmets(msg) {
        this.load();
        this.saveData.players.forEach((player) => {
            if (player.id === msg.author.id) {
                if (player.inventory.helmets.length === 0) {
                    msg.channel.send(`${msg.author.username}, you dont have any helmets! Go craft some!`);
                }
                else {
                    let text = `${msg.author.username}'s helmets:\n`;
                    let chants = '';
                    player.inventory.helmets.forEach((helmet, index) => {
                        if (helmet.enchants.length === 0) {
                            chants = 'None';
                        }
                        else {
                            chants = helmet.enchants.join(', ');
                        }
                        if (helmet.equipped) {
                            text += `**${index + 1}**: ${helmet.type} *Equipped*\n\tEnchantments: ${chants}\n\n`;
                        }
                        else {
                            text += `**${index + 1}**: ${helmet.type}\n\tEnchantments: ${chants}\n\n`;
                        }
                    });
                    msg.channel.send(text);
                }
            }
        });
    }
    displayChestplates(msg) {
        this.load();
        this.saveData.players.forEach((player) => {
            if (player.id === msg.author.id) {
                if (player.inventory.chestplates.length === 0) {
                    msg.channel.send(`${msg.author.username}, you don't have any chestplates! Go craft some!`);
                }
                else {
                    let text = `${msg.author.username}'s chestplates:\n`;
                    let chants = '';
                    player.inventory.chestplates.forEach((chestplate, index) => {
                        if (chestplate.enchants.length === 0) {
                            chants = 'None';
                        }
                        else {
                            chants = chestplate.enchants.join(', ');
                        }
                        if (chestplate.equipped) {
                            text += `**${index + 1}**: ${chestplate.type} *Equipped*\n\tEnchantments: ${chants}\n\n`;
                        }
                        else {
                            text += `**${index + 1}**: ${chestplate.type}\n\tEnchantments: ${chants}\n\n`;
                        }
                    });
                    msg.channel.send(text);
                }
            }
        });
    }
    displayLeggings(msg) {
        this.load();
        this.saveData.players.forEach((player) => {
            if (player.id === msg.author.id) {
                if (player.inventory.leggings.length === 0) {
                    msg.channel.send(`${msg.author.username}, you dont have any leggings! Go craft some!`);
                }
                else {
                    let text = `${msg.author.username}'s leggings:\n`;
                    let chants = '';
                    player.inventory.leggings.forEach((legging, index) => {
                        if (legging.enchants.length === 0) {
                            chants = 'None';
                        }
                        else {
                            chants = legging.enchants.join(', ');
                        }
                        if (legging.equipped) {
                            text += `**${index + 1}**: ${legging.type} *Equipped*\n\tEnchantments: ${chants}\n\n`;
                        }
                        else {
                            text += `**${index + 1}**: ${legging.type}\n\tEnchantments: ${chants}\n\n`;
                        }
                    });
                    msg.channel.send(text);
                }
            }
        });
    }
    displayBoots(msg) {
        this.load();
        this.saveData.players.forEach((player) => {
            if (player.id === msg.author.id) {
                if (player.inventory.boots.length === 0) {
                    msg.channel.send(`${msg.author.username}, you don't have any boots! Go craft some!`);
                }
                else {
                    let text = `${msg.author.username}'s boots:\n`;
                    let chants = '';
                    player.inventory.boots.forEach((boot, index) => {
                        if (boot.enchants.length === 0) {
                            chants = 'None';
                        }
                        else {
                            chants = boot.enchants.join(', ');
                        }
                        if (boot.equipped) {
                            text += `**${index + 1}**: ${boot.type} *Equipped*\n\tEnchantments: ${chants}\n\n`;
                        }
                        else {
                            text += `**${index + 1}**: ${boot.type}\n\tEnchantments: ${chants}\n\n`;
                        }
                    });
                    msg.channel.send(text);
                }
            }
        });
    }
    displayItems(msg) {
        this.load();
        this.saveData.players.forEach((player) => {
            if (player.id === msg.author.id) {
                let text = `${msg.author.username}'s items:\n`;
                text += `EXP: ${player.exp}\n`;
                text += `Lapis: ${player.inventory.lapis}\n`;
                text += `Cobblestone: ${player.inventory.cobblestone}\n`;
                text += `Coal: ${player.inventory.coal}\n`;
                text += `Iron Ore: ${player.inventory.iron_ore}\n`;
                text += `Gold Ore: ${player.inventory.gold_ore}\n`;             
                text += `Iron Ingot: ${player.inventory.iron_ingot}\n`;
                text += `Gold Ingot: ${player.inventory.gold_ingot}\n`;
                text += `Diamonds: ${player.inventory.diamond}`;
                msg.channel.send(text);
            }
        });
    }
    displayStats(msg) {
        this.load();
        let message = `${msg.author.username}'s Stats:\n`;
        this.saveData.players.forEach((player) => {
            if (player.id === msg.author.id) {
                message += `Normal Attempts: ${player.normal_attempts}\n`;
                message += `Normal Clears: ${player.normal_clears}\n`;
                message += `Hardcore Attempts: ${player.hardcore_attempts}\n`;
                message += `Hardcore Clears: ${player.hardcore_clears}`
                msg.channel.send(message);
            }
        });
    }
    displayEquipped(msg) {
        this.load();
        let message = `${msg.author.username}'s Loadout:\n`
        this.saveData.players.forEach((player) => {
            if (player.id === msg.author.id) {
                let index = player.inventory.swords.findIndex((sword) => sword.equipped === true);
                if (index === -1) {
                    message += `Sword: None!\n\n`;
                }
                else {
                    if (player.inventory.swords[index].enchants.length === 0) {
                        message += `Sword: ${player.inventory.swords[index].type}\n\tEnchantments: None\n`;
                    }
                    else {
                        message += `Sword: ${player.inventory.swords[index].type}\n\tEnchantments: ${player.inventory.swords[index].enchants.join(', ')}\n`;
                    }
                }
                index = player.inventory.helmets.findIndex((helmet) => helmet.equipped === true);
                if (index === -1) {
                    message += `Helmet: None!\n\n`;
                }
                else {
                    if (player.inventory.helmets[index].enchants.length === 0) {
                        message += `Helmet: ${player.inventory.helmets[index].type}\n\tEnchantments: None\n`;
                    }
                    else {
                        message += `Helmet: ${player.inventory.helmets[index].type}\n\tEnchantments: ${player.inventory.helmets[index].enchants.join(', ')}\n`;
                    }
                }
                index = player.inventory.chestplates.findIndex((chestplate) => chestplate.equipped === true);
                if (index === -1) {
                    message += `Chestplate: None!\n\n`;
                }
                else {
                    if (player.inventory.chestplates[index].enchants.length === 0) {
                        message += `Chestplate: ${player.inventory.chestplates[index].type}\n\tEnchantments: None\n`;
                    }
                    else {
                        message += `Chestplate: ${player.inventory.chestplates[index].type}\n\tEnchantments: ${player.inventory.chestplates[index].enchants.join(', ')}\n`;
                    }
                }
                index = player.inventory.leggings.findIndex((legging) => legging.equipped === true);
                if (index === -1) {
                    message += `Leggings: None!\n\n`;
                }
                else {
                    if (player.inventory.leggings[index].enchants.length === 0) {
                        message += `Leggings: ${player.inventory.leggings[index].type}\n\tEnchantments: None\n`;
                    }
                    else {
                        message += `Leggings: ${player.inventory.leggings[index].type}\n\tEnchantments: ${player.inventory.leggings[index].enchants.join(', ')}\n`;
                    }
                }
                index = player.inventory.boots.findIndex((boot) => boot.equipped === true);
                if (index === -1) {
                    message += `Boots: None!`;
                }
                else {
                    if (player.inventory.boots[index].enchants.length === 0) {
                        message += `Boots: ${player.inventory.boots[index].type}\n\tEnchantments: None`;
                    }
                    else {
                        message += `Boots: ${player.inventory.boots[index].type}\n\tEnchantments: ${player.inventory.boots[index].enchants.join(', ')}`;
                    }
                }
                msg.channel.send(message);
            }
        });
    }
    mine(msg, pickIndex) {
        this.load();
        let playerIndex = this.saveData.players.findIndex((player) => player.id === msg.author.id);
        if (playerIndex === -1) {
            msg.channel.send(`<@265567107280797696>, we got a big problem here. In mine.`);
        }
        else {
            if (pickIndex + 1 > this.saveData.players[playerIndex].inventory.picks.length || pickIndex < 0) {
                msg.channel.send(`${msg.author.username}, that pick doesn't exist! Please choose one that does.`);
                this.displayPicks(msg);
            }
            else {
                let blocks2Mine = 0;
                let treasureMod = 1;
                let speed = 0;
                this.picks.pickaxes.forEach((pickaxe) => {
                    if (this.saveData.players[playerIndex].inventory.picks[pickIndex].type === pickaxe.type) {
                        blocks2Mine = pickaxe.durability;
                        speed = pickaxe.speed;
                    }
                });
                this.saveData.players[playerIndex].inventory.picks[pickIndex].enchants.forEach((enchant) => {
                    this.enchants.PickEnchants.forEach((possible_enchant) => {
                        if (possible_enchant.type === enchant) {
                            blocks2Mine *= possible_enchant.durabilityMod;
                            treasureMod *= possible_enchant.treasureMod;
                            speed *= possible_enchant.speedMod;
                        }
                    });
                });
                this.saveData.players[playerIndex].mineTimeEnd = Math.floor((blocks2Mine/speed)*180000) + Date.now();
                let cobble = 0;
                let iron_blocks = 0;
                let coal_blocks = 0;
                let lapis_blocks = 0;
                let diamond_blocks = 0;
                let gold_blocks = 0;
                if (this.saveData.players[playerIndex].inventory.picks[pickIndex].type === "Wood" || this.saveData.players[playerIndex].inventory.picks[pickIndex].type === "Gold") {
                    for (let i = 0; i < blocks2Mine; i++) {
                        let rand = Math.floor(Math.random()*1000);
                        if (rand < 50) {
                            coal_blocks++;
                        }
                        else {
                            cobble++;
                        }
                    }
                }
                else if (this.saveData.players[playerIndex].inventory.picks[pickIndex].type === "Stone") {
                    for (let i = 0; i < blocks2Mine; i++) {
                        let rand = Math.floor(Math.random()*1000);
                        if (rand < 50) {
                            coal_blocks++;
                        }
                        else if (rand >= 50 && rand < 80) {
                            iron_blocks++;
                        }
                        else if (rand >= 80 && rand < 89) {
                            lapis_blocks += Math.floor((Math.random()*6) + 4);
                        }
                        else {
                            cobble++;
                        }
                    }
                }
                else {
                    for (let i = 0; i < blocks2Mine; i++) {
                        let rand = Math.floor(Math.random()*1000);
                        if (rand < 1) {
                            diamond_blocks++;
                        }
                        else if (rand >= 1 && rand < 4) {
                            gold_blocks++;
                        }
                        else if (rand >= 4 && rand < 13) {
                            lapis_blocks += Math.floor((Math.random()*6) + 4);
                        }
                        else if (rand >= 13 && rand < 43) {
                            iron_blocks++;
                        }
                        else if (rand >= 43 && rand < 93) {
                            coal_blocks++;
                        }
                        else {
                            cobble++;
                        }
                    }
                }
                this.saveData.players[playerIndex].temp_inventory.exp += (coal_blocks*2 + Math.floor(lapis_blocks*0.5) + diamond_blocks*10);
                this.saveData.players[playerIndex].temp_inventory.cobblestone += cobble;
                this.saveData.players[playerIndex].temp_inventory.iron_ore += Math.floor(iron_blocks*treasureMod);
                this.saveData.players[playerIndex].temp_inventory.diamond += Math.floor(diamond_blocks*treasureMod);
                this.saveData.players[playerIndex].temp_inventory.gold_ore += Math.floor(gold_blocks*treasureMod);
                this.saveData.players[playerIndex].temp_inventory.coal += Math.floor(coal_blocks*treasureMod);
                this.saveData.players[playerIndex].temp_inventory.lapis += Math.floor(lapis_blocks*treasureMod);
                this.saveData.players[playerIndex].inventory.picks.splice((pickIndex), 1);
                this.save(this.saveData);
                msg.channel.send(`${msg.author.username}, you are now mining. You will be done in ${this.getDoneTime(msg, 'mine')}. (HH:MM:SS)`);
                this.playerStates.delete(msg.author.id);
            }
        }
    }
    craft(msg, material, equipment) {
        this.load();
        let playerIndex = this.saveData.players.findIndex((player) => player.id === msg.author.id);
        if (playerIndex === -1) {
            msg.channel.send(`<@265567107280797696>, we got a big problem here. In craft.`);
        }
        else {
            if (equipment.startsWith('pick')) {
                if (this.saveData.players[playerIndex].inventory.picks.length >= 5) {
                    msg.channel.send(`${msg.author.username}, you have too many pickaxes and can't craft any more. To get rid of some, either mine with them or do "m.mine" and reply "destroy".`);
                }
                else {
                    if (material.startsWith('stone') || material.startsWith('cobble')) {
                        if (this.saveData.players[playerIndex].inventory.cobblestone < 3) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 3 Cobblestone\nYour inventory: ${this.saveData.players[playerIndex].inventory.cobblestone} Cobblestone`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.picks.push({
                                type: 'Stone',
                                enchants: [],
                            });
                            this.saveData.players[playerIndex].inventory.cobblestone -= 3;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('iron')) {
                        if (this.saveData.players[playerIndex].inventory.iron_ingot < 3) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 3 Iron Ingots\nYour inventory: ${this.saveData.players[playerIndex].inventory.iron_ingot} Iron Ingot(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.picks.push({
                                type: 'Iron',
                                enchants: [],
                            });
                            this.saveData.players[playerIndex].inventory.iron_ingot -= 3;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('gold')) {
                        if (this.saveData.players[playerIndex].inventory.gold_ingot < 3) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 3 Gold Ingots\nYour inventory: ${this.saveData.players[playerIndex].inventory.gold_ingot} Gold Ingot(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.picks.push({
                                type: 'Gold',
                                enchants: [],
                            });
                            this.saveData.players[playerIndex].inventory.gold_ingot -= 3;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('diamond')) {
                        if (this.saveData.players[playerIndex].inventory.diamond < 3) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 3 Diamonds\nYour inventory: ${this.saveData.players[playerIndex].inventory.diamond} Diamond(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.picks.push({
                                type: 'Diamond',
                                enchants: [],
                            });
                            this.saveData.players[playerIndex].inventory.diamond -= 3;
                            msg.react('✅');
                        }
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                }
            }
            else if (equipment.startsWith('sword')) {
                if (this.saveData.players[playerIndex].inventory.swords.length >= 5) {
                    msg.channel.send(`${msg.author.username}, you have too many swords and can't craft any more. To get rid of some, do "m.mine" and reply "destroy".`);
                }
                else {
                    if (material.startsWith('stone') || material.startsWith('cobble')) {
                        if (this.saveData.players[playerIndex].inventory.cobblestone < 2) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 2 Cobblestone\nYour inventory: ${this.saveData.players[playerIndex].inventory.cobblestone} Cobblestone`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.swords.push({
                                type: 'Stone',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.cobblestone -= 2;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('iron')) {
                        if (this.saveData.players[playerIndex].inventory.iron_ingot < 2) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 2 Iron Ingots\nYour inventory: ${this.saveData.players[playerIndex].inventory.iron_ingot} Iron Ingot(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.swords.push({
                                type: 'Iron',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.iron_ingot -= 2;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('gold')) {
                        if (this.saveData.players[playerIndex].inventory.gold_ingot < 2) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 2 Gold Ingots\nYour inventory: ${this.saveData.players[playerIndex].inventory.gold_ingot} Gold Ingot(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.swords.push({
                                type: 'Gold',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.gold_ingot -= 2;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('diamond')) {
                        if (this.saveData.players[playerIndex].inventory.diamond < 2) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 2 Diamonds\nYour inventory: ${this.saveData.players[playerIndex].inventory.diamond} Diamond(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.swords.push({
                                type: 'Diamond',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.diamond -= 2;
                            msg.react('✅');
                        }
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                }
            }
            else if (equipment.startsWith('helmet')) {
                if (this.saveData.players[playerIndex].inventory.helmets.length >= 5) {
                    msg.channel.send(`${msg.author.username}, you have too many helmets and can't craft any more. To get rid of some, do "m.mine" and reply "destroy".`);
                }
                else {
                    if (material.startsWith('stone') || material.startsWith('cobble')) {
                        msg.channel.send(`${msg.author.username}, Stone Helmets don't exist!`);
                    }
                    else if (material.startsWith('iron')) {
                        if (this.saveData.players[playerIndex].inventory.iron_ingot < 5) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 5 Iron Ingots\nYour inventory: ${this.saveData.players[playerIndex].inventory.iron_ingot} Iron Ingot(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.helmets.push({
                                type: 'Iron',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.iron_ingot -= 5;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('gold')) {
                        if (this.saveData.players[playerIndex].inventory.gold_ingot < 5) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 5 Gold Ingots\nYour inventory: ${this.saveData.players[playerIndex].inventory.gold_ingot} Gold Ingot(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.helmets.push({
                                type: 'Gold',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.gold_ingot -= 5;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('diamond')) {
                        if (this.saveData.players[playerIndex].inventory.diamond < 5) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 5 Diamonds\nYour inventory: ${this.saveData.players[playerIndex].inventory.diamond} Diamond(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.helmets.push({
                                type: 'Diamond',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.diamond -= 5;
                            msg.react('✅');
                        }
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                }
            }
            else if (equipment.startsWith('chestplate')) {
                if (this.saveData.players[playerIndex].inventory.chestplates.length >= 5) {
                    msg.channel.send(`${msg.author.username}, you have too many chestplates and can't craft any more. To get rid of some, do "m.mine" and reply "destroy".`);
                }
                else {
                    if (material.startsWith('stone') || material.startsWith('cobble')) {
                        msg.channel.send(`${msg.author.username}, Stone Chestplates don't exist!`);
                    }
                    else if (material.startsWith('iron')) {
                        if (this.saveData.players[playerIndex].inventory.iron_ingot < 8) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 8 Iron Ingots\nYour inventory: ${this.saveData.players[playerIndex].inventory.iron_ingot} Iron Ingot(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.chestplates.push({
                                type: 'Iron',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.iron_ingot -= 8;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('gold')) {
                        if (this.saveData.players[playerIndex].inventory.gold_ingot < 8) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 8 Gold Ingots\nYour inventory: ${this.saveData.players[playerIndex].inventory.gold_ingot} Gold Ingot(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.chestplates.push({
                                type: 'Gold',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.gold_ingot -= 8;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('diamond')) {
                        if (this.saveData.players[playerIndex].inventory.diamond < 8) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 8 Diamonds\nYour inventory: ${this.saveData.players[playerIndex].inventory.diamond} Diamond(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.chestplates.push({
                                type: 'Diamond',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.diamond -= 8;
                            msg.react('✅');
                        }
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                }
            }
            else if (equipment.startsWith('leggings')) {
                if (this.saveData.players[playerIndex].inventory.leggings.length >= 5) {
                    msg.channel.send(`${msg.author.username}, you have too many leggings and can't craft any more. To get rid of some, do "m.mine" and reply "destroy".`);
                }
                else {
                    if (material.startsWith('stone') || material.startsWith('cobble')) {
                        msg.channel.send(`${msg.author.username}, Stone Leggings don't exist!`);
                    }
                    else if (material.startsWith('iron')) {
                        if (this.saveData.players[playerIndex].inventory.iron_ingot < 7) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 7 Iron Ingots\nYour inventory: ${this.saveData.players[playerIndex].inventory.iron_ingot} Iron Ingot(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.leggings.push({
                                type: 'Iron',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.iron_ingot -= 7;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('gold')) {
                        if (this.saveData.players[playerIndex].inventory.gold_ingot < 7) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 7 Gold Ingots\nYour inventory: ${this.saveData.players[playerIndex].inventory.gold_ingot} Gold Ingot(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.leggings.push({
                                type: 'Gold',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.gold_ingot -= 7;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('diamond')) {
                        if (this.saveData.players[playerIndex].inventory.diamond < 7) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 7 Diamonds\nYour inventory: ${this.saveData.players[playerIndex].inventory.diamond} Diamond(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.leggings.push({
                                type: 'Diamond',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.diamond -= 7;
                            msg.react('✅');
                        }
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                }
            }
            else if (equipment.startsWith('boots')) {
                if (this.saveData.players[playerIndex].inventory.boots.length >= 5) {
                    msg.channel.send(`${msg.author.username}, you have too many boots and can't craft any more. To get rid of some, do "m.mine" and reply "destroy".`);
                }
                else {
                    if (material.startsWith('stone') || material.startsWith('cobble')) {
                        msg.channel.send(`${msg.author.username}, Stone Boots don't exist!`);
                    }
                    else if (material.startsWith('iron')) {
                        if (this.saveData.players[playerIndex].inventory.iron_ingot < 4) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 4 Iron Ingots\nYour inventory: ${this.saveData.players[playerIndex].inventory.iron_ingot} Iron Ingot(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.boots.push({
                                type: 'Iron',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.iron_ingot -= 4;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('gold')) {
                        if (this.saveData.players[playerIndex].inventory.gold_ingot < 4) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 4 Gold Ingots\nYour inventory: ${this.saveData.players[playerIndex].inventory.gold_ingot} Gold Ingot(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.boots.push({
                                type: 'Gold',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.gold_ingot -= 4;
                            msg.react('✅');
                        }
                    }
                    else if (material.startsWith('diamond')) {
                        if (this.saveData.players[playerIndex].inventory.diamond < 4) {
                            msg.react('❌');
                            msg.channel.send(`${msg.author.username}, you don't have the materials required to make that!\nNeeded: 4 Diamonds\nYour inventory: ${this.saveData.players[playerIndex].inventory.diamond} Diamond(s)`);
                        }
                        else {
                            this.saveData.players[playerIndex].inventory.boots.push({
                                type: 'Diamond',
                                enchants: [],
                                equipped: false
                            });
                            this.saveData.players[playerIndex].inventory.diamond -= 4;
                            msg.react('✅');
                        }
                    }
                    else {
                        this.unexpectedResponse(msg);
                    }
                }
            }
            else {
                this.unexpectedResponse(msg);
            }
            this.playerStates.delete(msg.author.id);
            this.save(this.saveData);
        }
    }
    destroy(msg, equipment, index) {
        this.load();
        let playerIndex = this.saveData.players.findIndex((player) => player.id === msg.author.id);
        if (playerIndex === -1) {
            msg.channel.send(`<@265567107280797696>, we got a big problem here. In destroy.`);
        }
        else {
            switch (equipment) {
                case 'Pick':
                    if (index + 1 > this.saveData.players[playerIndex].inventory.picks.length || index < 0) {
                        msg.channel.send(`${msg.author.username}, that pickaxe doesn't exist! Choose one that does exist to destroy.`);
                    }
                    else {
                        this.saveData.players[playerIndex].inventory.picks.splice(index, 1);
                        msg.react('✅');
                        this.playerStates.delete(msg.author.id);
                    }
                    break;
                case 'Sword':
                    if (index + 1 > this.saveData.players[playerIndex].inventory.swords.length || index < 0) {
                        msg.channel.send(`${msg.author.username}, that sword doesn't exist! Choose one that does exist to destroy.`);
                    }
                    else {
                        this.saveData.players[playerIndex].inventory.swords.splice(index, 1);
                        msg.react('✅');
                        this.playerStates.delete(msg.author.id);
                    }
                    break;
                case 'Helmet':
                    if (index + 1 > this.saveData.players[playerIndex].inventory.helmets.length || index < 0) {
                        msg.channel.send(`${msg.author.username}, that helmet doesn't exist! Choose one that does exist to destroy.`);
                    }
                    else {
                        this.saveData.players[playerIndex].inventory.helmets.splice(index, 1);
                        msg.react('✅');
                        this.playerStates.delete(msg.author.id);
                    }
                    break;
                case 'Chestplate':
                    if (index + 1 > this.saveData.players[playerIndex].inventory.chestplates.length || index < 0) {
                        msg.channel.send(`${msg.author.username}, that chestplate doesn't exist! Choose one that does exist to destroy.`);
                    }
                    else {
                        this.saveData.players[playerIndex].inventory.chestplates.splice(index, 1);
                        msg.react('✅');
                        this.playerStates.delete(msg.author.id);
                    }
                    break;
                case 'Leggings':
                    if (index + 1 > this.saveData.players[playerIndex].inventory.leggings.length || index < 0) {
                        msg.channel.send(`${msg.author.username}, those leggings don't exist! Choose one that does exist to destroy.`);
                    }
                    else {
                        this.saveData.players[playerIndex].inventory.leggings.splice(index, 1);
                        msg.react('✅');
                        this.playerStates.delete(msg.author.id);
                    }
                    break;
                case 'Boots':
                    if (index + 1 > this.saveData.players[playerIndex].inventory.boots.length || index < 0) {
                        msg.channel.send(`${msg.author.username}, those boots don't exist! Choose one that does exist to destroy.`);
                    }
                    else {
                        this.saveData.players[playerIndex].inventory.boots.splice(index, 1);
                        msg.react('✅');
                        this.playerStates.delete(msg.author.id);
                    }
                    break;
            }
            this.save(this.saveData);
        }
    }
    smelt(msg, type, amount) {
        this.load();
        let playerIndex = this.saveData.players.findIndex((player) => player.id === msg.author.id);
        if (playerIndex === -1) {
            msg.channel.send(`<@265567107280797696>, we got a big problem here. In smelt.`);
        }
        else {
            let total;
            switch (type) {
                case 'all':
                    total = this.saveData.players[playerIndex].inventory.iron_ore + this.saveData.players[playerIndex].inventory.gold_ore;
                    if (total === 0) {
                        msg.channel.send(`${msg.author.username}, you don't have any iron or gold ore to smelt!`);
                        this.playerStates.delete(msg.author.id);
                    }
                    else if (Math.ceil(total/8) > this.saveData.players[playerIndex].inventory.coal) {
                        msg.channel.send(`${msg.author.username}, you don't have enough coal to smelt all your iron and gold ore!`);
                        this.playerStates.delete(msg.author.id);
                    }
                    else {
                        this.saveData.players[playerIndex].smeltTimeEnd = Date.now() + total*10000;
                        msg.channel.send(`${msg.author.username}, you are now smelting ${this.saveData.players[playerIndex].inventory.iron_ore} Iron Ore and ${this.saveData.players[playerIndex].inventory.gold_ore} Gold Ore.\nYou will be done in ${this.getDoneTime(msg, 'smelt')}. (HH:MM:SS)`);
                        this.saveData.players[playerIndex].inventory.coal -= Math.ceil(total/8);
                        this.saveData.players[playerIndex].temp_inventory.iron_ingot += this.saveData.players[playerIndex].inventory.iron_ore;
                        this.saveData.players[playerIndex].temp_inventory.gold_ingot += this.saveData.players[playerIndex].inventory.gold_ore;
                        this.saveData.players[playerIndex].inventory.iron_ore = 0;
                        this.saveData.players[playerIndex].inventory.gold_ore = 0;
                        this.saveData.players[playerIndex].temp_inventory.exp += Math.floor(total*0.7);
                        this.playerStates.delete(msg.author.id);
                    }
                    break;
                case 'Iron':
                    if (amount === 'all') {
                        total = this.saveData.players[playerIndex].inventory.iron_ore;
                        if (total === 0) {
                            msg.channel.send(`${msg.author.username}, you don't have any Iron Ore to smelt!`);
                            this.playerStates.delete(msg.author.id);
                            break;
                        }
                    }
                    else {
                        total = amount;
                    }
                    if (total === 0) {
                        msg.channel.send(`${msg.author.username}, congrats, you smelted 0 Iron Ore....Maybe try a higher number?`);
                    }
                    else if (total < 0) {
                        msg.channel.send(`${msg.author.username}, give a **positive** number of Iron Ore to smelt.`);
                    }
                    else {
                        if (total > this.saveData.players[playerIndex].inventory.iron_ore) {
                            msg.channel.send(`${msg.author.username}, you don't have that much Iron Ore. You only have ${this.saveData.players[playerIndex].inventory.iron_ore} Iron Ore.`);
                            this.playerStates.delete(msg.author.id);
                        }
                        else if (Math.ceil(total/8) > this.saveData.players[playerIndex].inventory.coal) {
                            msg.channel.send(`${msg.author.username}, you don't have enough coal to smelt ${total} Iron Ore.\nTip: 1 piece of coal will smelt 8 items`);
                            this.playerStates.delete(msg.author.id);
                        }
                        else {
                            this.saveData.players[playerIndex].smeltTimeEnd = Date.now() + total*10000;
                            msg.channel.send(`${msg.author.username}, you are now smelting ${total} Iron Ore.\nYou will be done in ${this.getDoneTime(msg, 'smelt')}. (HH:MM:SS)`);
                            this.saveData.players[playerIndex].inventory.coal -= Math.ceil(total/8);
                            this.saveData.players[playerIndex].temp_inventory.iron_ingot += total;
                            this.saveData.players[playerIndex].inventory.iron_ore -= total;
                            this.saveData.players[playerIndex].temp_inventory.exp += Math.floor(total*0.7);
                            this.playerStates.delete(msg.author.id);
                        }
                    }
                    break;
                case 'Gold':
                    if (amount === 'all') {
                        total = this.saveData.players[playerIndex].inventory.gold_ore;
                        if (total === 0) {
                            msg.channel.send(`${msg.author.username}, you don't have any Gold Ore to smelt!`);
                            this.playerStates.delete(msg.author.id);
                            break;
                        }
                    }
                    else {
                        total = amount;
                    }
                    if (total === 0) {
                        msg.channel.send(`${msg.author.username}, congrats, you smelted 0 Gold Ore....Maybe try a higher number?`);
                    }
                    else if (total < 0) {
                        msg.channel.send(`${msg.author.username}, give a **positive** number of Gold Ore to smelt.`);
                    }
                    else {
                        if (total > this.saveData.players[playerIndex].inventory.gold_ore) {
                            msg.channel.send(`${msg.author.username}, you don't have that much Gold Ore. You only have ${this.saveData.players[playerIndex].inventory.gold_ore} Gold Ore.`);
                            this.playerStates.delete(msg.author.id);
                        }
                        else if (Math.ceil(total/8) > this.saveData.players[playerIndex].inventory.coal) {
                            msg.channel.send(`${msg.author.username}, you don't have enough coal to smelt ${total} Gold Ore.\nTip: 1 piece of coal will smelt 8 items`);
                            this.playerStates.delete(msg.author.id);
                        }
                        else {
                            this.saveData.players[playerIndex].smeltTimeEnd = Date.now() + total*10000;
                            msg.channel.send(`${msg.author.username}, you are now smelting ${total} Gold Ore.\nYou will be done in ${this.getDoneTime(msg, 'smelt')}. (HH:MM:SS)`);
                            this.saveData.players[playerIndex].inventory.coal -= Math.ceil(total/8);
                            this.saveData.players[playerIndex].temp_inventory.gold_ingot += total;
                            this.saveData.players[playerIndex].inventory.gold_ore -= total;
                            this.saveData.players[playerIndex].temp_inventory.exp += Math.floor(total*0.7);
                            this.playerStates.delete(msg.author.id);
                        }
                    }
                    break;
            }
            this.save(this.saveData);
        }
    }
    equip(msg, equipment, index) {
        this.load();
        let playerIndex = this.saveData.players.findIndex((player) => player.id === msg.author.id);
        if (playerIndex === -1) {
            msg.channel.send(`<@265567107280797696>, we got a big problem here. In equip.`);
        }
        else {
            let equippedIndex;
            switch (equipment) {
                case 'Helmet':
                    if (index + 1 > this.saveData.players[playerIndex].inventory.helmets.length || index < 0) {
                        msg.channel.send(`${msg.author.username}, that helmet doesn't exist! Try Again.`);
                        this.displayHelmets(msg);
                    }
                    else {
                        equippedIndex = this.saveData.players[playerIndex].inventory.helmets.findIndex((helmet) => helmet.equipped);
                        if (equippedIndex !== -1) {
                            this.saveData.players[playerIndex].inventory.helmets[equippedIndex].equipped = false;
                        }
                        this.saveData.players[playerIndex].inventory.helmets[index].equipped = true;
                        msg.react('✅');
                        this.playerStates.delete(msg.author.id);
                    }
                    break;
                case 'Chestplate':
                    if (index + 1 > this.saveData.players[playerIndex].inventory.chestplates.length || index < 0) {
                        msg.channel.send(`${msg.author.username}, that chestplate doesn't exist! Try Again.`);
                        this.displayChestplates(msg);
                    }
                    else {
                        equippedIndex = this.saveData.players[playerIndex].inventory.chestplates.findIndex((chestplate) => chestplate.equipped);
                        if (equippedIndex !== -1) {
                            this.saveData.players[playerIndex].inventory.chestplates[equippedIndex].equipped = false;
                        }
                        this.saveData.players[playerIndex].inventory.chestplates[index].equipped = true;
                        msg.react('✅');
                        this.playerStates.delete(msg.author.id);
                    }
                    break;
                case 'Leggings':
                    if (index + 1 > this.saveData.players[playerIndex].inventory.leggings.length || index < 0) {
                        msg.channel.send(`${msg.author.username}, those leggings don't exist! Try Again.`);
                        this.displayLeggings(msg);
                    }
                    else {
                        equippedIndex = this.saveData.players[playerIndex].inventory.leggings.findIndex((legging) => legging.equipped);
                        if (equippedIndex !== -1) {
                            this.saveData.players[playerIndex].inventory.leggings[equippedIndex].equipped = false;
                        }
                        this.saveData.players[playerIndex].inventory.leggings[index].equipped = true;
                        msg.react('✅');
                        this.playerStates.delete(msg.author.id);
                    }
                    break;
                case 'Boots':
                    if (index + 1 > this.saveData.players[playerIndex].inventory.boots.length || index < 0) {
                        msg.channel.send(`${msg.author.username}, those boots don't exist! Try Again.`);
                        this.displayBoots(msg);
                    }
                    else {
                        equippedIndex = this.saveData.players[playerIndex].inventory.boots.findIndex((boot) => boot.equipped);
                        if (equippedIndex !== -1) {
                            this.saveData.players[playerIndex].inventory.boots[equippedIndex].equipped = false;
                        }
                        this.saveData.players[playerIndex].inventory.boots[index].equipped = true;
                        msg.react('✅');
                        this.playerStates.delete(msg.author.id);
                    }
                    break;
                case 'Sword':
                    if (index + 1 > this.saveData.players[playerIndex].inventory.swords.length || index < 0) {
                        msg.channel.send(`${msg.author.username}, that sword doesn't exist! Try Again.`);
                        this.displaySwords(msg);
                    }
                    else {
                        equippedIndex = this.saveData.players[playerIndex].inventory.swords.findIndex((sword) => sword.equipped);
                        if (equippedIndex !== -1) {
                            this.saveData.players[playerIndex].inventory.swords[equippedIndex].equipped = false;
                        }
                        this.saveData.players[playerIndex].inventory.swords[index].equipped = true;
                        msg.react('✅');
                        this.playerStates.delete(msg.author.id);
                    }
                    break;
            }
            this.save(this.saveData);
        }
    }
}

module.exports = Minecraft;