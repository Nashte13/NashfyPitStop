export default {
  name: 'blogPost',
  title: 'NashfyPitStop News',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'content',
      title: 'Content',
      type: 'text',
      description: 'The main content of the blog post',
      validation: Rule => Rule.required()
    },
    {
      name: 'author',
      title: 'Author',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: Rule => Rule.required()
    },
    {
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: [
          { title: 'Fan Reaction', value: 'fan-reaction' },
          { title: 'Gossip', value: 'gossip' },
          { title: 'Watch Party', value: 'watch-party' },
          { title: 'Fan Opinion', value: 'fan-opinion' }
        ],
        layout: 'radio'
      },
      validation: Rule => Rule.required()
    },
    {
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'e.g., "Nairobi, Kenya" or "East Africa F1 Community"',
      validation: Rule => Rule.required()
    },
    {
      name: 'reactions',
      title: 'Reactions (Emojis)',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Add emoji reactions (e.g., 🔥, 🏎️, 💪)'
    }
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'type',
      date: 'date'
    },
    prepare({ title, subtitle, date }) {
      return {
        title: title,
        subtitle: `${subtitle} • ${date ? new Date(date).toLocaleDateString() : 'No date'}`
      }
    }
  }
}

