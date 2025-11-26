export default {
  name: 'aboutPage',
  title: 'About Page',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      initialValue: 'About NashfyPitStop'
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Main description/intro text'
    },
    {
      name: 'mission',
      title: 'Mission',
      type: 'text',
      description: 'Our mission statement'
    },
    {
      name: 'whatWeDo',
      title: 'What We Do',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'icon',
              title: 'Icon (Emoji)',
              type: 'string',
              description: 'e.g., 🏟️, 📣, 🎙️, 🤝'
            },
            {
              name: 'title',
              title: 'Title',
              type: 'string'
            },
            {
              name: 'description',
              title: 'Description',
              type: 'text'
            }
          ]
        }
      ]
    },
    {
      name: 'whyKenya',
      title: 'Why Kenya? Why East Africa?',
      type: 'text',
      description: 'Explanation about why Kenya/East Africa'
    },
    {
      name: 'joinMovement',
      title: 'Join the Movement',
      type: 'text',
      description: 'Text about joining the movement'
    },
    {
      name: 'values',
      title: 'Values',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Community values (e.g., Community First, Local Focus)'
    }
  ],
  preview: {
    prepare() {
      return {
        title: 'About Page'
      }
    }
  }
}

