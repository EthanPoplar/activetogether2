export const programs = [
  {
    id: "p1",
    name: "U12 Soccer Clinic",
    venue: "RecWest Footscray",
    location: { lat: -37.8036, lng: 144.8881, address: "39 Essex St, Footscray VIC" },
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
    location: { lat: -37.7914, lng: 144.9123, address: "18-22 Wests Rd, Maribyrnong VIC" },
    when: "Tue 09:00",
    cost: 2,
    tags: ["Seniors","Low impact"],
    accessible: true,
    reviews: [{ user: "aisha", rating: 5, text: "Inclusive space." }]
  },
  {
    id: "p3",
    name: "Women's Social Basketball",
    venue: "Kensington YMCA",
    location: { lat: -37.7961, lng: 144.9311, address: "120 Racecourse Rd, Kensington VIC" },
    when: "Thu 18:30",
    cost: 5,
    tags: ["Women","Intermediate"],
    accessible: false,
    reviews: [{ user: "kim", rating: 4, text: "Good workout!" }]
  }
];

export const avgRating = (p) =>
  p.reviews.reduce((a,r) => a + r.rating, 0) / p.reviews.length;
