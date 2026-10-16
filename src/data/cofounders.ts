export type Cofounder = {
  id: string
  name: string
  role: string
  bio: string
  photo: string
  linkedin?: string
  github?: string
}

export const cofounders: Cofounder[] = [
  {
    id: 'cofounder-one',
    name: 'Co-founder One',
    role: 'Co-founder',
    bio: 'Add a short introduction about their journey and what they’re building here.',
    photo: '/images/cofounders/cofounder-one.jpg', // TODO: replace with a real co-founder photo.
  },
  {
    id: 'cofounder-two',
    name: 'Co-founder Two',
    role: 'Co-founder',
    bio: 'Add a short introduction about their journey and what they’re building here.',
    photo: '/images/cofounders/cofounder-two.jpg', // TODO: replace with a real co-founder photo.
  },
  {
    id: 'cofounder-three',
    name: 'Co-founder Three',
    role: 'Co-founder',
    bio: 'Add a short introduction about their journey and what they’re building here.',
    photo: '/images/cofounders/cofounder-three.jpg', // TODO: replace with a real co-founder photo.
  },
]
