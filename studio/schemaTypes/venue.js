export default {
  name: 'venue',
  title: 'Watch Party Venue',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Venue Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'location',
      title: 'Location',
      type: 'string',
      description: 'Full address or location description',
      validation: Rule => Rule.required()
    },
    {
      name: 'city',
      title: 'City',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Brief description of the venue',
      validation: Rule => Rule.required()
    },
    {
      name: 'capacity',
      title: 'Capacity',
      type: 'string',
      description: 'e.g., "50+ people"',
      validation: Rule => Rule.required()
    },
    {
      name: 'amenities',
      title: 'Amenities',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'List of amenities (e.g., Large Screens, Food & Drinks, Parking)'
    },
    {
      name: 'image',
      title: 'Venue Image',
      type: 'image',
      options: {
        hotspot: true
      }
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'city',
      media: 'image'
    }
  }
}

