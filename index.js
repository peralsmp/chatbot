        const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
        const axios = require('axios');
        const qrcode = require('qrcode-terminal');
        const { GEMINI_API_KEY } = require('./config');

        async function startBot() {
          const { state, saveCreds } = await useMultiFileAuthState('auth_info');
          const sock = makeWASocket({
            auth: state,
            printQRInTerminal: true
          });

          sock.ev.on('creds.update', saveCreds);

          sock.ev.on('connection.update', ({ connection, qr }) => {
            if (qr) {
              qrcode.generate(qr, { small: true });
              console.log("📱 Scan this QR with WhatsApp");
            }
            if (connection === 'open') {
              console.log("✅ Bot is connected to WhatsApp!");
            }
          });

          sock.ev.on('messages.upsert', async ({ messages, type }) => {
            if (type !== 'notify') return;
            const msg = messages[0];
            const sender = msg.key.remoteJid;
            const senderId = msg.key.participant || msg.key.remoteJid;

            const text =
              msg.message?.conversation ||
              msg.message?.extendedTextMessage?.text ||
              msg.message?.imageMessage?.caption ||
              '';

            console.log(`💬 [${sender}] ${text}`);

            if (!text || !sender.endsWith('@g.us')) return;

            // Just say hi
            if (text.toLowerCase() === 'hi bot') {
              await sock.sendMessage(sender, {
                text: '👋 Hi! I am Gemini Bot. Mention @gembot or use !add / !remove',
              }, { quoted: msg });
            }

            // 🤖 Gemini AI Trigger
            if (text.toLowerCase().startsWith('@gembot')) {
              const prompt = text.replace('@gembot', '').trim();

              try {
                const response = await axios.post(
                  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
                  {
                    contents: [{ parts: [{ text: prompt }] }]
                  },
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      'X-Goog-Api-Key': GEMINI_API_KEY
                    }
                  }
                );

                const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "❌ Gemini didn't respond.";
                await sock.sendMessage(sender, { text: reply }, { quoted: msg });

              } catch (error) {
                console.error("Gemini error:", error.response?.data || error.message);
                await sock.sendMessage(sender, { text: "❌ Gemini API error." }, { quoted: msg });
              }
            }

            // 👥 Add group member
            if (text.startsWith('!add ')) {
              const number = text.split(' ')[1].replace(/[^0-9]/g, '');
              const jid = `${number}@s.whatsapp.net`;

              try {
                await sock.groupParticipantsUpdate(sender, [jid], 'add');
                await sock.sendMessage(sender, { text: `✅ Added: ${number}` }, { quoted: msg });
              } catch (err) {
                console.error(err);
                await sock.sendMessage(sender, { text: `❌ Failed to add ${number}.` }, { quoted: msg });
              }
            }

            // ❌ Remove group member
            if (text.startsWith('!remove ')) {
              const number = text.split(' ')[1].replace(/[^0-9]/g, '');
              const jid = `${number}@s.whatsapp.net`;

              try {
                await sock.groupParticipantsUpdate(sender, [jid], 'remove');
                await sock.sendMessage(sender, { text: `❌ Removed: ${number}` }, { quoted: msg });
              } catch (err) {
                console.error(err);
                await sock.sendMessage(sender, { text: `⚠️ Failed to remove ${number}.` }, { quoted: msg });
              }
            }
          });
        }

        startBot();
