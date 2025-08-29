export const programs = [
  {
    id: "p1",
    name: "U12 Soccer Clinic",
    venue: "RecWest Footscray",
    when: "Sat 10:00",
    cost: 0,
    tags: ["Kids","Beginner"],
    accessible: true,
    reviews: [
      { user: "maria", rating: 5, text: "Great coaches!" },
      { user: "james", rating: 4, text: "Well organised." }
    ]
  },
  {
    id: "p2",
    name: "Seniors Tai-Chi",
    venue: "Maribyrnong Hub",
    when: "Tue 09:00",
    cost: 2,
    tags: ["Seniors","Low impact"],
    accessible: true,
    reviews: [{ user: "aisha", rating: 5, text: "Inclusive space." }]
  },
  {
    id: "p3",
    name: "Women’s Social Basketball",
    venue: "Kensington YMCA",
    when: "Thu 18:30",
    cost: 5,
    tags: ["Women","Intermediate"],
    accessible: false,
    reviews: [{ user: "kim", rating: 4, text: "Good workout!" }]
  }
];

export const avgRating = (p) =>
  p.reviews.reduce((a,r) => a + r.rating, 0) / p.reviews.length;
