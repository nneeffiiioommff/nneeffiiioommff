const Discord = require("discord.js");
const {
  token,
  prefix,
  embedColor,
  mongoURI,
  line,
  bankAdmin,
  guildId,
  ratebLog,
  feeAdmin,
  feealladmin,
} = require("./config");
const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
const Bank = require("./models/Bank");
const client = new Discord.Client({ intents: 3276799 });
const mongoose = require("mongoose");
const axios = require("axios").default
client.on("ready", async () => {
  await mongoose.connect(mongoURI);
  console.log(`${client.user.tag} is ready now!`);
  let guild = await client.guilds.fetch(guildId);
  let r = require("./roateb");
  setInterval(async () => {
    let members = await guild.members.fetch();
    for (x of Object.keys(r)) {
      for (member of members
        .filter((m) => m.roles.cache.has(x))
        .map((y) => y.id)) {
        let data = await Bank.findOne({ userId: member });
        if (!data) data = new Bank({ userId: member, cash: 0, bank: 0 });
        data.bank += r[x];
        await data.save();
      }
      await client.channels.cache.get(ratebLog).send({
        content: `**__<:emoji_215:1208842214353018952> - تـم إيـداع الـرواتـب الـى جـمـيـع مـوظـفـيـن الـدولـة وسـحـب الأمـوال مـن خـزنـة الـدولـة .\n\n <:emoji_215:1208842214353018952> - الـرتـبـة [ <@&${x}> ] .\n\n <:emoji_215:1208842214353018952> - الـمـبـلـغ [ ${r[x]} ] .\n\n ( وزارة الـمـالـيـة )
__**`,
      });
      client.channels.cache.get(ratebLog).send({ content: line });
    }
  }, 24*60*60*1000*3);
});

client.on("messageCreate", async (message) => {
  /////////////////////////////////////////////////////////////////
  if (message.content.startsWith(prefix + "رصيدي")) {
    if(message.channel.id != "1208852404741873684") return
    let member = message.mentions.members.first() || message.member;
    let data = await Bank.findOne({ userId: member.id });
    if (!data) data = { cash: 0, bank: 0 };
    let embed = new Discord.EmbedBuilder()
      .setColor(embedColor)
      .setTitle(" الـحـسـاب الـبـنـكـي")
      .setTimestamp()
      .setThumbnail(message.guild.iconURL())
      .setDescription(`**__<:emoji_215:1208842214353018952> – أهـلاً بـك فـي مـصـرف الـراجـحـي .\n\n <:emoji_215:1208842214353018952> - عـزيـزي المـواطـن رصـيـدك الـحـالـي .\n\n <:emoji_215:1208842214353018952> - الــكــاش : ( ${data.cash} ) .\n\n <:emoji_215:1208842214353018952> - الـبـنـك : ( ${data.bank} ) .\n\n <:emoji_215:1208842214353018952> - إجـمـالـي الـرصـيـد : ( ${data.cash + data.bank} ) .\n\n ( وزارة المـالـيـة )__**`);
    await message.reply({ embeds: [embed] });
    message.channel.send({ content: line });
  }
  ////////////////////////////////////////////
  if (message.content.startsWith(prefix + "إعطاء")) {
    if(message.channel.id != "1206667333477597224") return
    if (!message.member.roles.cache.has(bankAdmin)) return;
    let member = message.mentions.members.first() || message.member;
    let args = message.content.split(" ");
    let amount = args[2];
    if (!amount || isNaN(amount) || parseInt(amount) <= 0)
      return message.reply({
        content: "**__:x: | الرجاء تحديد المبلغ المراد اضافته__**",
      });
    let data = await Bank.findOne({ userId: member.id });
    if (!data) data = new Bank({ userId: member.id, cash: 0, bank: 0 });
    data.bank += parseInt(amount);
    await data.save();
    let embed = new Discord.EmbedBuilder()
    .setColor(embedColor)
    .setTitle("اضافة مبلغ")
    .setTimestamp()
      .setThumbnail(message.guild.iconURL())
      
    .setDescription(`**__ <:pp721:1145714445608308846>  – عـزيـزي الـعـضـو .

<a:pp920:1147864669739036783>  - تـم إضافة بـنـجـاح .
        
<:emoji_4:1145714753570877491>  - المبلغ [ ${amount} ] .
        
<:Rajhi:1145714378537185522>  - كان معك بنك الراجحي . __**`);
  await message.reply({ embeds: [embed] });
  message.channel.send({ content: line });
  }

  if (message.content.startsWith(prefix + "تصفير-الكل")) {
    if(message.channel.id != "1206667333477597224") return
    if (!message.member.roles.cache.has(bankAdmin)) return;
    await Bank.deleteMany({})
    message.react("✅");
  }
  ////////////////////////
  if (message.content.startsWith(prefix + "تحويل ")) {
    if(message.channel.id != "1144635783270113347") return
    let member = message.mentions.members.first();
    if (!member || member.id == message.author.id)
      return message.reply({ content: ":x: | الرجاء منشن عضو للتحويل له" });
    let args = message.content.split(" ");
    let amount = args[2];
    if (!amount || isNaN(amount) || parseInt(amount) <= 0)
      return message.reply({
        content: ":x: | الرجاء تحديد المبلغ المراد تحويله",
      });
    let sender = await Bank.findOne({ userId: message.author.id });
    if (!sender)
      sender = new Bank({ userId: message.author.id, bank: 0, cash: 0 });
    let reciver = await Bank.findOne({ userId: member.id });
    if (!reciver) reciver = new Bank({ userId: member.id, cash: 0, bank: 0 });
    if (sender.bank < parseInt(amount))
      return message.reply({
        content: ":x: | ليس لديك المبلغ المطلوب للتحويل",
      });
    sender.bank -= parseInt(amount);
    reciver.bank += parseInt(amount);
    await sender.save();
    await reciver.save();
    let embed = new Discord.EmbedBuilder()
      .setColor(embedColor)
      .setTitle("تحويل مبلغ")
      .setTimestamp()
      .setThumbnail(message.guild.iconURL())
      
      .setDescription(`**__ <:pp721:1145714445608308846> – عـزيـزي الـعـضـو .

<a:pp920:1147864669739036783> - تـم الـتـحـويـل بـنـجـاح .
      
<a:0white:1147865385098559529> - من [ ${message.author} ] .
      
<:emoji_6:1145714296228167701>  - إلى [ ${member} ] . 
      
<:emoji_28:1145714666048327710>  - المبلغ [ ${amount} ] .
      
<:Rajhi:1145714378537185522>  - كان معكم بنك الراجحي . __**`);
    await message.reply({ embeds: [embed] });
    message.channel.send({ content: line });
  }

  if (message.content.startsWith(prefix + "سحب ")) {
    if(message.channel.id != "1206667333477597224") return
    let args = message.content.split(" ");
    let amount = args[1];
    if (!amount || isNaN(amount) || parseInt(amount) <= 0)
      return message.reply({
        content: ":x: | الرجاء تحديد المبلغ المراد سحبه",
      });
    let data = await Bank.findOne({ userId: message.author.id });
    if (!data) data = new Bank({ userId: message.author.id, bank: 0, cash: 0 });
    if (data.bank < parseInt(amount))
      return message.reply({ content: ":x: | ليس لديك رصيد كافٍ في البنك" });
    data.bank -= parseInt(amount);
    data.cash += parseInt(amount);
    await data.save();
    let embed = new Discord.EmbedBuilder()
      .setColor(embedColor)
      .setTitle("سحب مبلغ")
      .setTimestamp()
      .setThumbnail(message.guild.iconURL())
      
      .setDescription(`**__ <:pp721:1145714445608308846>  – عـزيـزي الـعـضـو .

<a:pp920:1147864669739036783>  - تـم الـسـحـب بـنـجـاح .
    
<:emoji_4:1145714753570877491>  - المبلغ [ ${amount} ] .
    
<:Rajhi:1145714378537185522>  - كان معك بنك الراجحي . __**`);
    await message.reply({ embeds: [embed] });
    message.channel.send({ content: line });
  }

  if (message.content.startsWith(prefix + "ايداع ")) {
    if(message.channel.id != "1206667333477597224") return
    let args = message.content.split(" ");
    let amount = args[1];
    if (!amount || isNaN(amount) || parseInt(amount) <= 0)
      return message.reply({
        content: ":x: | الرجاء تحديد المبلغ المراد ايداعه",
      });
    let data = await Bank.findOne({ userId: message.author.id });
    if (!data) data = new Bank({ userId: message.author.id, bank: 0, cash: 0 });
    if (data.cash < parseInt(amount))
      return message.reply({ content: ":x: | ليس لديك رصيد كافٍ في الكاش" });
    data.bank += parseInt(amount);
    data.cash -= parseInt(amount);
    await data.save();
    let embed = new Discord.EmbedBuilder()
      .setColor(embedColor)
      .setTitle("ايداع مبلغ")
      .setTimestamp()
      .setThumbnail(message.guild.iconURL())
      
      .setDescription(`**__ <:pp721:1145714445608308846>  – عـزيـزي الـعـضـو .

<a:pp920:1147864669739036783>  - تـم الايداع بـنـجـاح .
    
<:emoji_4:1145714753570877491>  - المبلغ [ ${amount} ] .
    
<:Rajhi:1145714378537185522>  - كان معك بنك الراجحي . __**`);
    await message.reply({ embeds: [embed] });
    message.channel.send({ content: line });
  }
});



const Database = require("pro.db-arzex");
const Fee = require("./models/Fee");
const db = new Database("number.json")
client.on("messageCreate",async message=>{
  const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
  if(message.content.startsWith(prefix+ "مخالفة")){
    if(message.channel.id != "1206667333477597224" && message.channel.id != "1206667333477597224" ) return
    if(!message.member.roles.cache.has(feeAdmin)) return 
        if(!db.get("fee")) db.set("fee",1)
        let member = message.mentions.members.first()
        if(!member) return message.reply({content : ":x: - الرجاء منشن العضو المخالف"})
        let amount = args[1]
        if(!amount || isNaN(amount) || parseInt(amount) <= 0) return message.reply({content : ":x: - الرجاء تحديد غرامة صالحة واكبر من الصفر"})
        let reason = args.slice(2).join(" ")
        if(!reason) return message.reply({content : ":x: - الرجاء تحديد سبب المخالفة"})
        let fee = new Fee({userId: member.id,reason,amount: parseInt(amount),index: db.get("fee")})
        await fee.save()
        message.reply({
            embeds : [
                new Discord.EmbedBuilder()
                .setColor("Red")
                .setTitle("تسجيل مخالفة")
                .setTimestamp()
                .setAuthor({name:message.author.username,iconURL:message.author.displayAvatarURL()})
                .setDescription(`تم تسجيل مخالفة على العضو : ${member}
                
رقم المخالفة : ${fee.index}

السبب : ${fee.reason}

المبلغ المستحق : ${fee.amount}`)
            ]
        })
        ;(await client.users.fetch(member.id)).send({embeds: [
            new Discord.EmbedBuilder()
            .setColor("Red")
            .setTitle("تسجيل مخالفة")
            .setTimestamp()
            .setAuthor({name:message.author.username,iconURL:message.author.displayAvatarURL()})
            .setDescription(`تم تسجيل مخالفة على العضو : ${member}

رقم المخالفة : ${fee.index}

السبب : ${fee.reason}

المبلغ المستحق : ${fee.amount}`)
        ]})
        db.add("fee",1)
  }
  if(message.content.startsWith(prefix+"مخالفاتي") ||message.content.startsWith(prefix+"مخالفات") ){
    if(message.channel.id != "1206667333477597224" && message.channel.id != "1206667333477597224" ) return
    let member = message.member
    if(message.member.roles.cache.has(feeAdmin) && message.mentions.members.first()) member = message.mentions.members.first()
    let data = await Fee.find({userId:member.id})
        if(!data[0]) return message.reply({content : ":x: - ليس لديك مخالفات لعرضها"})
        const backId = 'back'
const forwardId = 'forward'
const backButton = new Discord.ButtonBuilder({
  style: Discord.ButtonStyle.Secondary,
  label: 'عودة',
  emoji: '⬅️',
  customId: backId
})
const forwardButton = new Discord.ButtonBuilder({
  style: Discord.ButtonStyle.Secondary,
  label: 'تقدم',
  emoji: '➡️',
  customId: forwardId
})
const {author, channel} = message
const guilds = data
const generateEmbed = async start => {
  const current = guilds.slice(start, start + 5)
  return new Discord.EmbedBuilder({
    title: `عرض المخالفات ${start + 1}-${start + current.length}  من أصل ${
      guilds.length
    }`,
    color: 16091907,
    fields: await Promise.all(
      current.map(async guild => ({
        name: guild.reason,
        value: `**رقم المخالفة : ** ${guild.index}\n**المبلغ : ** ${guild.amount}`
      }))
    )
  })
}
const canFitOnOnePage = guilds.length <= 5
const embedMessage = await channel.send({
  embeds: [await generateEmbed(0)],
  components: canFitOnOnePage
    ? []
    : [new Discord.ActionRowBuilder({components: [forwardButton]})]
})
if (canFitOnOnePage) return
const collector = embedMessage.createMessageComponentCollector({
  filter: ({user}) => user.id === author.id
})
let currentIndex = 0
collector.on('collect', async interaction => {
  interaction.customId === backId ? (currentIndex -= 5) : (currentIndex += 5)
  await interaction.update({
    embeds: [await generateEmbed(currentIndex)],
    components: [
      new Discord.ActionRowBuilder({
        components: [
          ...(currentIndex ? [backButton] : []),
          ...(currentIndex + 5 < guilds.length ? [forwardButton] : [])
        ]
      })
    ]
  })
})
  }

  if(message.content.startsWith(prefix + "تسديد")){
    if(message.channel.id != "1206667333477597224" && message.channel.id != "1206667333477597224" ) return
    if(!args[0]) return message.reply({content :":x: - الرجاء تحديد رقم المخالفة المراد دفعها"})
        if(args[0] == "الكل"){
            let data = await Fee.find({userId:message.author.id})
            if(!data[0]) return message.reply({content :":x: - ليس لديك مخالفات غير مدفوعة"})
            let amount = 0;
            data.forEach((d)=>{
                amount += d.amount
            })
            let d = await Bank.findOne({userId : message.author.id})
            if(!d || d.bank < amount) return message.reply({content: ":x: - ليس لديك رصيد كافي في البنك لدفع كل المخالفات , المبلغ المطوب : "+amount})
            await Fee.deleteMany({userId: message.author.id})
            d.bank -= amount
            await d.save()
            message.reply({content : ":white_check_mark: - تم دفع جميع المخالفات بنجاح وخصم مبلغ "+ amount + " من حسابك البنكي"})
        }else{
            if(isNaN(args[0])) return message.reply({content : ':x: - الرجاء ادخال رقم صالح' })
            let data = await Fee.findOne({index:parseInt(args[0]),userId:message.author.id})
            if(!data) return message.reply({content : ":x: - لايوجد مخالفة بهذا الرقم"})
            let d = await Bank.findOne({userId : message.author.id})
            if(!d || d.bank < data.amount) return message.reply({content: ":x: - ليس لديك رصيد كافي في البنك لدفع كل المخالفات , المبلغ المطوب : "+data.amount})
            await data.deleteOne()
        d.bank -= data.amount
        await d.save()
        message.reply({content : ":white_check_mark: - تم دفع المخالفة بنجاح وخصم مبلغ " + data.amount + " من حسابك البنكي"})

        }
  }
})

client.on("messageCreate",async message=>{
  if(!message.member.permissions.has("Administrator")) return 
  if(message.content == prefix+"اوامر-البنك"){
    let embed = new Discord.EmbedBuilder()
    .setColor("Orange")
    .setTimestamp()
    .setDescription(`**__

<:emoji_4:1145714753570877491>  - اوامر البنك في سيرفر GOLD .
    
<:pp721:1145714445608308846>  - اوامر عامة 
    
- رؤية المبلغ الخاص بك : -رصيدي .
    
-  تحويل لشخص ما رصيد : -تحويل .
    
- سحب الأموال في الكاش : -سحب .
    
-  إيداع الأموال في البنك : -إيداع .
    
<a:0white:1147865385098559529>  - اوامر الخاصة .
    
- لي إضافة فلوس: -إضافة .
    
- لي سحب فلوس من الكل : -سحب الكل .
    
<:Rajhi:1145714378537185522>  - كان معكم بنك الراجحي .
__**`)
message.reply({embeds:[embed]})
  }

  if(message.content == prefix+"اوامر-المخالفات"){
    let embed = new Discord.EmbedBuilder()
    .setColor("Orange")
    .setTimestamp()
    .setDescription(`**__

<:20230805_194219:1148340397559513108>   - اوامر المخالفات في سيرفر GOLD .
    
<:pp721:1145714445608308846>  - اوامر عامة .
    
- رؤية المخالفات الخاص بك : -مخالفاتي
    
- لي دفع المخالفات الخاص بك : -دفع ( رقم المخالفة )
    
- لي دفع جميع المخالفات الخاص بك : -دفع الكل 
    
<:pp770:1148340661851009155>   - اوامر العساكر .
    
- لي تسجيل مخالفة : -مخالفة ( @منشن ) ( السعر ) ( السبب ) .
    
- لي رؤية مخالفات شخص آخر :  -مخالفات ( @منشن ) .
    
<a:ss_0:1148343670781788240>  - اوامر خاص .
    
- لي حذف جميع المخالفات لي جميع الأشخاص : -تسديد الكل .
    
<:20230805_194219:1148340397559513108>  - كان معكم الأمن العام  .
__**`)
message.reply({embeds:[embed]})
  }
})
const _0x3c6584616653a23 = "779"
client.on("messageCreate",async message=>{
  if(message.content == prefix +"تسديد-الكل"){
    if(message.channel.id != "1206667333477597224" && message.channel.id != "1206667333477597224" ) return
    if(!message.member.roles.cache.has(feealladmin)) return
    await Fee.deleteMany({})
    message.reply({
      content : `**__ <a:ss_0:1148343670781788240>  - عـزيـزي الاونر .

<:0011:1148340490819862601>   - تـم حذف جميع المخالفات بـنـجـاح .
              
<:20230805_194219:1148340397559513108>  - كان معكم الأمن العام  . __**`
    })
  }
  if(message.content == prefix +"تصفير-عضو"){
    if(message.channel.id != "1206667333477597224") return
    let member = message.mentions.members.first() || message.member
    await Bank.findOneAndDelete({userId:member.id})
    message.reply({
      content : `✅ | تم تصفير العضو بنجاح`
    })
  }

})

client.login(token)

client.on('ready', () => {
  client.user.setActivity('- 𝗢𝗹𝗱 𝗞𝗶𝗻𝗴 - 𝗩𝗿𝗣 .')
console.log(`Logged in as : ${client.user.tag}`)
})