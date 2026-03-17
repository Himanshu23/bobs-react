declare module 'react-awesome-slider/dist/autoplay' {
  import type React from 'react';
  import type AwesomeSlider from 'react-awesome-slider';

  type AwesomeSliderProps = React.ComponentProps<typeof AwesomeSlider>;

  export default function withAutoplay(
    component: typeof AwesomeSlider
  ): React.ComponentType<
    AwesomeSliderProps & {
      play?: boolean;
      cancelOnInteraction?: boolean;
      interval?: number;
    }
  >;
}
