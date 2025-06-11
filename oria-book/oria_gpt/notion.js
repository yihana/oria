import fetch from 'node-fetch';

import dotenv from 'dotenv';

dotenv.config({ path: './.env' });

const notionToken = process.env.NOTION_TOKEN;

const dbMap = {

  GPT: process.env.DB_GPT,

  BLOG_BACKUP: process.env.DB_BLOG_BACKUP,

  BLOG_UPDATE: process.env.DB_BLOG_UPDATE,

  THREAD: process.env.DB_THREAD,

  PHONE: process.env.DB_PHONE,

  KEEP: process.env.DB_KEEP,

  MEMO: process.env.DB_MEMO

};

export async function saveToNotion(title, content, keywords, channel) {

  const databaseId = dbMap[channel];

  if (!databaseId) {

    console.error('❌ Unknown channel:', channel);

    return;

  }

  const res = await fetch('https://api.notion.com/v1/pages', {

    method: 'POST',

    headers: {

      'Authorization': `Bearer ${notionToken}`,

      'Content-Type': 'application/json',

      'Notion-Version': '2022-06-28'

    },

    body: JSON.stringify({

      parent: { database_id: databaseId },

      properties: {

        Title: {

          title: [

            {

              text: {

                content: title

              }

            }

          ]

        },

        Date: {

          date: {

            start: new Date().toISOString()

          }

        },

        Channel: {

          rich_text: [

            {

              text: {

                content: channel

              }

            }

          ]

        },

        Keywords: {

          multi_select: keywords.map(k => ({ name: k }))

        }

      },

      children: [

        {

          object: 'block',

          type: 'paragraph',

          paragraph: {

            rich_text: [

              {

                type: 'text',

                text: {

                  content: content

                }

              }

            ]

          }

        }

      ]

    })

  });

  const data = await res.json();

  if (!res.ok) {

    console.error('❌ 저장 실패:', JSON.stringify(data, null, 2));

  } else {

    console.log('✅ 저장 완료 GPT');

  }

}