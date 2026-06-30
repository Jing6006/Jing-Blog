---
title: 前端-动态鲸鱼提示词
date: 2026-06-30 18:38:01
updated: 2026-06-30 18:38:01
tags:
categories:
  - 开发调优
description: 鲸鱼森林 × 地火生命 双屏电影感网页提示词文档（交流合作：SWAN02_）
cover:
abbrlink: 开发调优-前端-动态鲸鱼提示词
synced_from_content_repo: true
source_path: 开发调优/前端-动态鲸鱼提示词.md
source_hash: 9b3b6c7a7c9a9fecd71c933327f3e7e1d5fa5145
---

# 鲸鱼森林 × 地火生命 双屏电影感网页提示词文档（交流合作：SWAN02_）

This is a complete prompt document for recreating the current two-section cinematic webpage effect. This document does not use local image or video paths. All visual assets have been rewritten as generative prompts.

## 1. Overall Project Prompt

Create a two-section immersive cinematic visual webpage with the theme: “Upper Dream Forest × Lower Earth-Fire Life”.

The first section is themed around the Whale Forest: a blue-violet nighttime forest, a luminous giant whale, a dreamlike woodland, bioluminescence, a fusion of deep ocean and forest, quiet, mysterious, premium fantasy. The scene should feel like the opening shot of a film trailer, not an ordinary landing page.

The second section is themed around Earth-Fire Life: charcoal-black lava cracks, orange-red subterranean fire, moss, tiny white flowers, young sprouts, and life returning from scorched rock layers. Use mouse movement to reveal a hidden life layer. When the user moves the mouse, the green life beneath the dark lava surface should gradually appear.

The overall style should be premium, restrained, dark, cinematic, and immersive. Do not use cartoons, children’s illustration, game UI, cyberpunk, cheap neon, complex navigation, card modules, or information-heavy layouts.

The webpage should contain only two sections. Do not add extra pages or complex navigation. Place HTML, CSS, and JS in a single `index.html` file. Do not use React, Vue, Three.js, or large external libraries.

## 2. First Section Video Asset Generation Prompt

### English Prompt

Generate a cinematic horizontal video: a dreamlike forest at night, with blue-violet moonlight and bioluminescence drifting through the tree canopy. A colossal luminous whale slowly floats above the forest, as if it has moved from the deep ocean into a forest dream. The forest contains faint mist. Leaves and moss glow subtly in blue, violet, and cyan-green bioluminescent tones. The camera slowly pushes forward. The scene should feel quiet, mysterious, vast, premium, and cinematic, with soft lighting, shallow depth of field, realistic materials. Do not make it cartoonish, illustrative, game-like, or overly neon.

### English Prompt

Cinematic wide video of a dreamlike bioluminescent forest at night. A colossal luminous whale drifts slowly above the treetops, as if the deep ocean has merged with an ancient forest. Blue and violet moonlight moves through mist, moss, leaves, and glowing spores. The scene feels quiet, mysterious, immersive, and premium, with a sense of scale and wonder. Slow camera push-in, soft volumetric fog, subtle bioluminescence, realistic textures, shallow depth of field, dark fantasy natural atmosphere, film trailer opening shot. No cartoon, no illustration, no cyberpunk, no cheap neon, no game UI.

### Suggested Video Parameters

- Aspect ratio: 16:9
- Duration: 8 to 12 seconds
- Camera: slow push-in or subtle drifting movement
- Style: cinematic, dark fantasy, bioluminescent forest, realistic, premium
- Colors: blue-violet, deep black, cool cyan, a small amount of soft warm white
- Motion: slow, no violent camera shake

## 3. Second Section Dark Layer Image Prompt

This image is used as the surface dark lava-crack layer in the second section, which is the main layer users see before mouse reveal.

### English Prompt

Generate an ultra-realistic cinematic horizontal image: a charcoal-black cooled lava surface, rough, wrinkled, cracked, with orange-red molten lava light glowing through the fissures. Low-angle close-up view, sharp rock texture, black volcanic rock with subtle wet reflections, lava light leaking from deep cracks. The background is extremely dark, with strong vignetting, shallow depth of field, and premium cinematic quality. No plants, no flowers, no people, no educational diagram, no cartoon, no illustration.

### English Prompt

Ultra realistic cinematic wide image of cooled black lava rock, rough wrinkled volcanic crust with glowing orange-red molten cracks underneath. Low angle macro landscape, detailed basalt texture, subtle wet reflections on black rock, lava light leaking from deep fissures, dark background, strong vignette, shallow depth of field, premium film still. No plants, no flowers, no people, no cartoon, no illustration, no educational diagram.

## 4. Second Section Life Layer Image Prompt

This image is used as the hidden life layer revealed by the mouse in the second section.

### English Prompt

Generate an ultra-realistic cinematic horizontal image: green moss, tiny white flowers, and young sprouts growing between cracks in black cooled lava. A subtle orange-red magma glow remains deep inside the fissures. The image should be a low-angle close-up, like a miniature natural landscape. The black volcanic rock texture should be rough. Green moss covers parts of the rock surface. The small flowers should be delicate, realistic, and restrained, not too many. The overall theme is “life returning after earth-fire.” Use a dark background, premium cinematic feeling, shallow depth of field, realistic materials, and contrast between orange-red heat and green life. No cartoon, no fairytale illustration, no overly bright colors.

### English Prompt

Ultra realistic cinematic wide image of new life growing from cooled black lava fissures. Green moss, tiny white wildflowers, and young sprouts emerge between rough volcanic rock, while a subtle orange-red magma glow remains deep inside the cracks. Low angle macro landscape, realistic basalt texture, delicate restrained plants, dark background, shallow depth of field, premium film still. Theme: life returning after fire. No cartoon, no illustration, no overly bright colors, no people.

## 5. Webpage Structure Prompt

Create a single-file `index.html` with two sections:

First section:
- Use the “Whale Forest video” as the background.
- Top-left small text: `BIOLUMINESCENT FOREST`
- Main title in two lines: `THE WHALE` / `FOREST`
- Subtitle: `where luminous giants drift through the sleeping canopy`
- Bottom-left description: `A DREAM ABOVE THE CANOPY`
- Bottom-right button: `EXPLORE`
- Bottom-center hint: `SCROLL DOWN`

Second section:
- The background consists of two stacked images: the bottom layer is the “life layer image”, and the top layer is the “dark lava image”.
- When the mouse moves, use a mask or radial-gradient to reveal the life image underneath.
- Top-left title group:
  - Small text: `BENEATH THE CRUST`
  - Main title in two lines: `THE FIRE` / `BENEATH`
  - Subtitle: `life returns beneath the burned stone`
- Right-side vertical hint: `move gently · reveal the living seam`

## 6. Typography and Text Style Prompt

Use premium serif fonts for main titles:
- Cinzel
- Cormorant Garamond
- Georgia
- serif fallback

Use a thin italic serif style for subtitles:
- Cormorant Garamond
- Georgia
- italic

Use modern sans-serif fonts for small text, buttons, and hints:
- Montserrat
- Inter
- Arial
- sans-serif

First-section main title color should be close to pure white:
- `rgba(255, 255, 255, 0.96)`

The first-section title shadow should feel like moonlit blue and subtle violet glow, not orange-red volcanic light:
- soft blue glow
- violet ambient light
- dark shadow

The second-section title should use warm white and orange-red earth-fire glow:
- warm white typography
- low-intensity orange-red glow
- dark shadow

## 7. First Section Layout Prompt

Place the first-section main title in the left-middle area. Do not center it rigidly.

Recommended layout:
- `.hero-copy` is positioned at left: 5vw, vertically around 48%
- Main title max width around 900px
- The title displays in two lines
- `THE WHALE` appears first, `FOREST` appears later
- Place the subtitle below the main title with a slight indent, but do not put it too far from the title
- Top-left small text stays fixed in the top-left area
- Bottom-left description stays in the bottom-left corner
- `EXPLORE` button stays in the bottom-right corner
- `SCROLL DOWN` stays at the bottom center and should be visually weaker

## 8. Second Section Layout Prompt

Place the second-section title area in the top-left. Do not cover important image details.

Recommended layout:
- `.reveal-ui` is positioned at top: 12vh, left: 6vw
- Main title displays in two lines: `THE FIRE` / `BENEATH`
- The title should be smaller than the first-section title while maintaining a cinematic poster feel
- The subtitle should have lower opacity, but remain readable
- The right-side vertical hint should be very subtle and should not steal attention

## 9. Text Animation Prompt

The overall text animation should feel like a film title sequence, not ordinary website motion.

First section:
- Top-left small text appears first with fade-in, slight upward movement, and tightening letter spacing
- Main title appears line by line
- Main title enters from slight blur, scale-up, and upward movement
- `THE WHALE` appears first, then `FOREST` appears with a delay
- After the title enters, add an extremely subtle “floating underwater” breathing effect
- Subtitle, bottom-left description, and button emerge sequentially from mist
- The floating amplitude must be small and should not feel cheap or shaky

Underwater floating effect:
- Title slowly moves up and down by 4 to 7px
- Extremely slight rotation, no more than 0.2deg
- Scale should not exceed 1.01
- Light and shadow breathe subtly
- Cycle duration: 7 to 8 seconds

Second section:
- Trigger text animation when scrolling into the second section
- Small text appears first
- Main title transitions from blur to clear while moving slightly upward
- Subtitle appears with a delay
- Right-side vertical hint breathes subtly

## 10. Mouse Interaction Prompt

First section:
- Add a subtle blue-violet bioluminescent glow around the mouse
- The glow should be low-opacity and should not dominate the scene
- The main title should move with very slight parallax based on mouse movement
- Title horizontal movement should be no more than 7 to 8px, vertical movement no more than 5px
- All mouse updates should use `requestAnimationFrame`

Second section:
- Mouse movement reveals the life layer
- Use CSS mask or radial-gradient
- The reveal edge must be softly feathered, not hard-edged
- Add a soft orange-red magma glow around the cursor
- When the mouse leaves the second section, the reveal area should shrink and return to the center
- Reveal position should use `requestAnimationFrame` interpolation for smooth movement, not harsh cursor-following

## 11. Scroll Experience Prompt

- The page has two vertical sections
- Support smooth scrolling directly from the first section to the second section when the user scrolls down
- Clicking `EXPLORE` should smoothly scroll to the second section
- The scrolling should feel smooth and not stutter
- During scrolling, do not let multiple animations fight over the same `transform`
- You may temporarily disable scroll-snap during programmatic scrolling, then restore it after scrolling completes

## 12. Visual Mask Prompt

First-section mask:
- Keep the vignette
- Slightly darken the left side to ensure title readability
- Add a black fade at the bottom
- Do not make the scene too dark
- Keep the whale forest visual subject visible on the right side

Second-section mask:
- Keep a strong vignette
- Add slight black fades at the top and bottom
- Use orange-red glow around the mouse reveal area to enhance depth
- Do not cover the life-layer details

## 13. Complete Delivery Prompt

Generate a complete `index.html` according to the following requirements:

Create a two-section premium cinematic interactive webpage with the theme “THE WHALE FOREST / THE FIRE BENEATH”. The first section uses a blue-violet bioluminescent whale forest video background. The second section uses an image-reveal interaction between lava cracks and returning life. Do not add extra pages, navigation, card modules, or a commercial landing-page structure.

First-section copy:
- `BIOLUMINESCENT FOREST`
- `THE WHALE`
- `FOREST`
- `where luminous giants drift through the sleeping canopy`
- `A DREAM ABOVE THE CANOPY`
- `EXPLORE`
- `SCROLL DOWN`

Second-section copy:
- `BENEATH THE CRUST`
- `THE FIRE`
- `BENEATH`
- `life returns beneath the burned stone`
- `move gently · reveal the living seam`

Font system:
- Main titles: Cinzel / Cormorant Garamond / Georgia / serif
- Subtitles: Cormorant Garamond / Georgia / italic
- Small text and buttons: Montserrat / Inter / Arial / sans-serif

Animations:
- First-section title appears line by line
- Title enters from blur, scale-up, and upward movement
- After entering, the title gently floats as if underwater
- Subtitle, button, and small text fade in sequentially
- Second-section text animates from blur to clarity when entering the viewport
- Mouse movement has a restrained glow
- In the second section, mouse movement reveals the life layer with soft feathered edges

Technical:
- Single-file HTML/CSS/JS
- Do not use React, Vue, or Three.js
- Do not introduce large external libraries
- Throttle mouse and scroll events with `requestAnimationFrame`
- The page must not have a horizontal scrollbar
- The console must not show obvious errors

## 14. Negative Prompt

No cartoon.
No children’s illustration.
No game UI.
No cyberpunk.
No cheap neon.
No ordinary travel webpage.
No elementary-school science style.
No information-heavy layout.
No complex navigation.
No character introduction module.
No stacked commercial buttons.
No PPT-style oversized text layout.
Do not turn the first section into a volcano theme.
Do not use `VOLCANIC AWAKENING` in the first section.
Do not overuse glow.
Do not let text block the main visual subject.
Do not make animations bounce dramatically.
Do not make mouse effects feel like generic website trickery.

## 15. Recommended Generation Order

1. Generate the first-section whale forest video first.
2. Then generate the second-section dark lava image.
3. Then generate the second-section life layer image.
4. Finally, use the complete delivery prompt to generate the webpage.
5. If the webpage does not feel premium enough, prioritize adjusting font hierarchy, text position, vignette, animation rhythm, and glow opacity. Do not add more modules.
