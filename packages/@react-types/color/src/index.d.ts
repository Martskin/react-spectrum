/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {BaseSliderProps} from '@react-types/slider';
import {Color} from '@react-stately/color';
import {StyleProps, ValueBase} from '@react-types/shared';

/** A list of supported color formats. */
export type ColorFormat = 'hex' | 'hexa' | 'rgb' | 'rgba' | 'hsl' | 'hsla' | 'hsb' | 'hsba';

/** A list of color channels. */
export type ColorChannel = 'hue' | 'saturation' | 'brightness' | 'lightness' | 'red' | 'green' | 'blue' | 'alpha';

export interface ColorWheelState {
  readonly value: Color,
  setValue(value: string | Color): void,

  // numeric value for the current channel
  readonly channelValue: number,
  readonly channelValuePercent: number,
  setChannelValue(value: number): void,
  setChannelValuePercent(value: number): void,

  // Based on props but normalized and include defaults based on selected channel.
  minValue: number,
  maxValue: number,

  dragging: boolean,
  setDragging(value: boolean): void
}

export interface ColorWheelStateProps {
  channel: ColorChannel,
  onChange?: (Color) => void,
  minValue: number,
  maxValue: number
}

// @ts-ignore
export interface ColorWheelProps extends BaseSliderProps, ValueBase<Color>, StyleProps {
  channel: ColorChannel,
  // overriding these to allow passing string:
  value?: string | Color,
  defaultValue?: string | Color
}

export interface SpectrumColorWheelProps extends ColorWheelProps {
  size?: number
}
