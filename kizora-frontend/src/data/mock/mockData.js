export const mockAnime = [
  {
    id: "1",
    title: "Shadow Strikers",
    synopsis: "In a world where shadows come alive, a young boy discovers he has the power to control them.",
    coverImage: "https://placehold.co/600x800/121620/F8FAFC?text=Shadow+Strikers",
    bannerImage: "https://placehold.co/1200x400/121620/F8FAFC?text=Shadow+Strikers+Banner",
    status: "Airing",
    score: 8.5,
    genres: ["Action", "Fantasy", "Shounen"],
    episodes: 12,
  },
  {
    id: "2",
    title: "Cyber Neon Tokyo",
    synopsis: "A cyberpunk thriller set in a futuristic Tokyo where memory can be downloaded and altered.",
    coverImage: "https://placehold.co/600x800/121620/F8FAFC?text=Cyber+Neon+Tokyo",
    bannerImage: "https://placehold.co/1200x400/121620/F8FAFC?text=Cyber+Neon+Tokyo+Banner",
    status: "Completed",
    score: 9.1,
    genres: ["Sci-Fi", "Thriller", "Cyberpunk"],
    episodes: 24,
  },
  {
    id: "3",
    title: "Slice of Magic",
    synopsis: "Daily life of a witch who runs a quiet cafe in the countryside.",
    coverImage: "https://placehold.co/600x800/121620/F8FAFC?text=Slice+of+Magic",
    bannerImage: "https://placehold.co/1200x400/121620/F8FAFC?text=Slice+of+Magic+Banner",
    status: "Airing",
    score: 7.8,
    genres: ["Slice of Life", "Magic", "Comedy"],
    episodes: 12,
  }
];

export const mockEpisodes = {
  "1": [
    { id: "e1", number: 1, title: "The Awakening", duration: "24:00" },
    { id: "e2", number: 2, title: "First Mission", duration: "24:00" }
  ],
  "2": [
    { id: "e1", number: 1, title: "Data Breach", duration: "24:00" },
    { id: "e2", number: 2, title: "Alleyway Chase", duration: "24:00" }
  ],
  "3": [
    { id: "e1", number: 1, title: "Morning Brew", duration: "24:00" },
  ]
};

export const mockSchedule = {
  "Monday": ["1"],
  "Tuesday": [],
  "Wednesday": ["3"],
  "Thursday": [],
  "Friday": ["2"],
  "Saturday": [],
  "Sunday": []
};

export const mockProfile = {
  id: "u1",
  name: "KizoraFan99",
  avatar: "https://placehold.co/100x100/3B82F6/F8FAFC?text=KF",
  joined: "2023-01-15",
  stats: {
    episodesWatched: 342,
    daysWatched: 5.2
  }
};
