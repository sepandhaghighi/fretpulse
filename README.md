<div align="center">
    <img src="https://github.com/sepandhaghighi/fretpulse/raw/main/assets/logo.png" alt="FretPulse Logo" width="300">
    <h1>FretPulse: Professional Multi-Instrument Tuner</h1>
    <br/>
    <a href="https://fretpulse.ir"><img src="https://img.shields.io/badge/demo-fretpulse.ir-green.svg"></a>
    <a href="https://github.com/sepandhaghighi/fretpulse"><img alt="GitHub repo size" src="https://img.shields.io/github/repo-size/sepandhaghighi/fretpulse"></a>
    <a href="https://github.com/sepandhaghighi/fretpulse"><img src="https://img.shields.io/github/stars/sepandhaghighi/fretpulse.svg?style=social&label=Stars"></a>
</div>

## Overview

FretPulse is a browser-based professional multi-instrument tuner built with Web Audio API. It provides real-time pitch detection through your microphone, automatic and manual tuning modes, adjustable A4 calibration, multiple instrument and tuning presets, custom tunings, and an interactive fretboard with reference tones for guitar, bass, and ukulele.


<table>
	<tr> 
		<td align="center">Code Quality</td>
		<td align="center"><a href="https://www.codefactor.io/repository/github/sepandhaghighi/fretpulse"><img src="https://www.codefactor.io/repository/github/sepandhaghighi/fretpulse/badge" alt="CodeFactor"></a></td>
		<td align="center"></td>
	</tr>
</table>


## Features

* **Multi-Instrument Support** - Tune acoustic guitar, electric guitar, bass guitar, and ukulele

* **Real-Time Pitch Detection** - Detect instrument pitch directly through your microphone using the Web Audio API

* **Automatic Tuning Mode** - Automatically identify the played note and display its tuning accuracy

* **Manual Tuning Mode** - Select an individual string and tune against its reference pitch

* **Tuning Presets** - Includes standard, drop, open, half-step, and other common tunings

* **Custom Tunings** - Configure individual string notes for a personalized tuning setup

* **A4 Calibration** - Adjust the reference pitch from 430 Hz to 450 Hz

* **Interactive Fretboard** - Select strings visually and play synthesized reference tones

* **Visual Tuning Gauge** - Monitor pitch accuracy with a responsive needle and cent display

* **Instrument-Specific Sound** - Reference tones are synthesized with different decay and brightness characteristics for each instrument

* **In-Tune Detection** - Clearly indicates when a note is within ±5 cents of the target pitch

* **Responsive Interface** - Clean dark-themed interface designed for desktop and mobile use


## Usage

* **Instrument**: Select Acoustic Guitar, Electric Guitar, Ukulele, or Bass Guitar

* **Tuning Preset**: Choose a predefined tuning or select Custom to configure individual strings

* **Pitch A4**: Adjust the reference A4 frequency between 430 Hz and 450 Hz

* **Auto**: Automatically detect the played note and show whether it is flat, sharp, or in tune

* **Manual**: Select a string from the interactive fretboard and tune to its reference pitch

* **Start Microphone**: Grant microphone access and begin real-time pitch detection

* **String Pegs**: Click a string on the fretboard to select it and play its synthesized reference tone

* **Custom Tuning**: Choose a target note for each string when using the Custom tuning preset



## Local Development

To test FretPulse locally, you can use [Ghps](https://github.com/sepandhaghighi/ghps) a minimal GitHub Pages simulator written in pure Python.

Run:

```console
ghps --port 5003
```

Then open your browser and visit:

```console
http://localhost:5003
```

## Issues & Bug Reports

Just fill an issue and describe it. We'll check it ASAP! or send an email to [info@fretpulse.ir](mailto:info@fretpulse.ir "info@fretpulse.ir"). 

- Please complete the issue template