export default {
  name: 'clubMember',
  title: 'Club Member',
  type: 'document',
  fields: [
    {
      name: 'name',
      title: 'Name',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'email',
      title: 'Email',
      type: 'email',
      validation: Rule => Rule.required()
    },
    {
      name: 'city',
      title: 'City',
      type: 'string',
      validation: Rule => Rule.required()
    },
    {
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true
    },
    {
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Pending', value: 'pending' },
          { title: 'Approved', value: 'approved' },
          { title: 'Rejected', value: 'rejected' }
        ],
        layout: 'radio'
      },
      initialValue: 'pending'
    }
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'email',
      status: 'status'
    },
    prepare({ title, subtitle, status }) {
      return {
        title: title,
        subtitle: `${subtitle} • ${status}`
      }
    }
  }
}

