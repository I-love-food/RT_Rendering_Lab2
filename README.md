# RT_Rendering_Lab2
![preview](image.png)
## Functionality
Draw shapes including: `square`, `triangle`, `point`, `vertical line`, `horizontal line`.

2D transformations including: `scale`, `rotate`
## Usage
### How to launch
Open `main.html` with your browser.

Then, three `alert` are expected to pop out which indicate successful creation of `vertex`, `fragment` shaders and shader program.

After close those `alert`s, a black canvas will appear.

### Modes

There are two modes: `Create` and `Select`

In `Create` mode, you can specify the next shape and color you want to draw, with left mouse click on the canvas, you can add a new shape on the canvas.

In `Select` mode, you can pick any shapes (and any number of them) you have previously drawn, and change their color, size and orientation.

Use "C" (uppercase) to switch between modes.

### Key specifications

r, g, b -> specify color of your next shape (or current selected shapes) including: `red`, `green`, `blue`

p, v, h, t, q -> specify next shape including: `point`, `vertical line`, `horizontal line`, `triangle`, `square`

c -> clear the canvas

C -> switch modes between "Create" and "Select"

S -> scale up the selected shape

s -> scale down the selected shape

left mouse -> move down (up) to rotate (counter) clockwise

W -> select all shapes for transforming all shapes 

w -> de-selected all shapes

## Bonus point attempted
1. Object selection, color change and scaling.

2. Customized matrix arithmetic.

## Software Info
Operating system: Windows 11

Web browser: Microsoft Edge

