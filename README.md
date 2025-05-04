# PAPERCUTTING.art

Across continents and millennia, people have cut paper to tell stories, celebrate life, and express culture. [PAPERCUTTING.art](https://papercutting.art) explores how a digital tool can reinterpret this age-old folk art as a space for creativity, connection, and cultural reflection.

## Project Description

[PAPERCUTTING.art](https://papercutting.art) is a web-based vector-graphics design tool that simulates the tactile experience of cutting paper. With virtual scissors, anyone can explore, experiment with, and create custom paper-cutting pieces. These can then be exported in digital formats for sharing or as printable templates to be cut by hand. Inspired by the artist’s childhood memories of making papercuts with his mother—and her enduring love for the medium—the project reimagines that sensory joy and intimacy in digital form. Just as physical paper-cutting artworks are often displayed or gifted to express appreciation and celebrate special moments, [PAPERCUTTING.art](https://papercutting.art) offers people from different cultural backgrounds a way to connect through the shared act of making and giving.

## Technical Overview

### Custom Geometry Library

Handles virtual cutting logic, tracks paths, and updates shape data to ensure consistent behavior during on-screen interaction and export.

### Rendering

- Real-time graphics are rendered on canvas using [p5.js](https://p5js.org/).
- A custom SVG renderer mirrors the same geometry for vector output.
- Additional p5.js logic generates printable templates.

### Exporting

- **Image**: Exported using p5.js built-in functions (PNG and other formats).
- **Vector**: Exported via a custom SVG generator.
- **Video**: Captured using [p5.capture](https://github.com/tapioca24/p5.capture) (MP4, WebM, etc.).
- **JSON**: Saved in a custom format for reloading and editing.

### Deployment

Built with [Vite](https://vite.dev/) and deployed on [Netlify](https://www.netlify.com/).

## Contributing

[Data Schemas](./docs/schema.md)

## References

**Geometry & Algorithms**

- [Geometric Algorithms](https://www.dcs.gla.ac.uk/~pat/52233/slides/Geometry1x1.pdf) (University of Glasgow, Paterson)
- [RDP Line Simplification](https://www.youtube.com/watch?v=nSYw9GrakjY) (The Coding Train, Daniel Shiffman)
- [Determine If a List of Polygon Points Are in Clockwise Order](https://stackoverflow.com/questions/1165647/how-to-determine-if-a-list-of-polygon-points-are-in-clockwise-order) (Stack Overflow)
- [Linear Congruential Generator](https://en.wikipedia.org/wiki/Linear_congruential_generator) (Wikipedia)
- [Point of Intersection of Two Lines](https://www.geeksforgeeks.org/program-for-point-of-intersection-of-two-lines/) (GeeksforGeeks)
- [Area of a Polygon With Given N Ordered Vertices](https://www.geeksforgeeks.org/area-of-a-polygon-with-given-n-ordered-vertices/) (GeeksforGeeks)
- [Equation of a Line From 2 Points](https://www.mathsisfun.com/algebra/line-equation-2points.html) (Math Is Fun)
- [p5.Vector.js Source Code](https://github.com/processing/p5.js/blob/0e0ca80d6018392bba0bfca84a3a213492af7412/src/math/p5.Vector.js) (Processing Foundation)

**JavaScript Utilities**

- [Detect the User's OS in the Browser](https://www.30secondsofcode.org/js/s/browser-os-detection/) (30 Seconds of Code)
- [How to Download a File Using JavaScript](https://www.delftstack.com/howto/javascript/javascript-download/) (DelftStack)
- [Shuffle an Array](https://javascript.info/task/shuffle) (JavaScript.info)
