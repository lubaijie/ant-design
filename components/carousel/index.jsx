import { inject } from 'vue';
import PropTypes from '../_util/vue-types';
import debounce from 'lodash/debounce';
import hasProp, { initDefaultProps, getComponent } from '../_util/props-util';
import { ConfigConsumerProps } from '../config-provider';
import warning from '../_util/warning';
import classNames from 'classnames';

// matchMedia polyfill for
// https://github.com/WickyNilliams/enquire.js/issues/82
if (typeof window !== 'undefined') {
  const matchMediaPolyfill = mediaQuery => {
    return {
      media: mediaQuery,
      matches: false,
      addListener() {},
      removeListener() {},
    };
  };
  // ref: https://github.com/ant-design/ant-design/issues/18774
  if (!window.matchMedia) window.matchMedia = matchMediaPolyfill;
}
// Use require over import (will be lifted up)
// make sure matchMedia polyfill run before require('vc-slick')
// Fix https://github.com/ant-design/ant-design/issues/6560
// Fix https://github.com/ant-design/ant-design/issues/3308
const SlickCarousel = require('../vc-slick/src').default;

export const CarouselEffect = PropTypes.oneOf(['scrollx', 'fade']);
// Carousel
export const CarouselProps = {
  effect: CarouselEffect,
  dots: PropTypes.bool,
  vertical: PropTypes.bool,
  autoplay: PropTypes.bool,
  easing: PropTypes.string,
  beforeChange: PropTypes.func,
  afterChange: PropTypes.func,
  // style: PropTypes.React.CSSProperties,
  prefixCls: PropTypes.string,
  accessibility: PropTypes.bool,
  nextArrow: PropTypes.any,
  prevArrow: PropTypes.any,
  pauseOnHover: PropTypes.bool,
  // className: PropTypes.string,
  adaptiveHeight: PropTypes.bool,
  arrows: PropTypes.bool,
  autoplaySpeed: PropTypes.number,
  centerMode: PropTypes.bool,
  centerPadding: PropTypes.string,
  cssEase: PropTypes.string,
  dotsClass: PropTypes.string,
  draggable: PropTypes.bool,
  fade: PropTypes.bool,
  focusOnSelect: PropTypes.bool,
  infinite: PropTypes.bool,
  initialSlide: PropTypes.number,
  lazyLoad: PropTypes.bool,
  rtl: PropTypes.bool,
  slide: PropTypes.string,
  slidesToShow: PropTypes.number,
  slidesToScroll: PropTypes.number,
  speed: PropTypes.number,
  swipe: PropTypes.bool,
  swipeToSlide: PropTypes.bool,
  touchMove: PropTypes.bool,
  touchThreshold: PropTypes.number,
  variableWidth: PropTypes.bool,
  useCSS: PropTypes.bool,
  slickGoTo: PropTypes.number,
  responsive: PropTypes.array,
  dotPosition: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
};

const Carousel = {
  name: 'ACarousel',
  inheritAttrs: false,
  props: initDefaultProps(CarouselProps, {
    dots: true,
    arrows: false,
    draggable: false,
  }),
  setup() {
    return {
      configProvider: inject('configProvider', ConfigConsumerProps),
    };
  },
  beforeMount() {
    this.onWindowResized = debounce(this.onWindowResized, 500, {
      leading: false,
    });
  },
  mounted() {
    if (hasProp(this, 'vertical')) {
      warning(
        !this.vertical,
        'Carousel',
        '`vertical` is deprecated, please use `dotPosition` instead.',
      );
    }
    const { autoplay } = this;
    if (autoplay) {
      window.addEventListener('resize', this.onWindowResized);
    }
    // https://github.com/ant-design/ant-design/issues/7191
    this.innerSlider = this.slick && this.slick.innerSlider;
  },
  beforeUnmount() {
    const { autoplay } = this;
    if (autoplay) {
      window.removeEventListener('resize', this.onWindowResized);
      this.onWindowResized.cancel();
    }
  },
  methods: {
    getDotPosition() {
      if (this.dotPosition) {
        return this.dotPosition;
      }
      if (hasProp(this, 'vertical')) {
        return this.vertical ? 'right' : 'bottom';
      }
      return 'bottom';
    },
    saveSlick(node) {
      this.slick = node;
    },
    onWindowResized() {
      // Fix https://github.com/ant-design/ant-design/issues/2550
      const { autoplay } = this;
      if (autoplay && this.slick && this.slick.innerSlider && this.slick.innerSlider.autoPlay) {
        this.slick.innerSlider.autoPlay();
      }
    },

    next() {
      this.slick.slickNext();
    },

    prev() {
      this.slick.slickPrev();
    },

    goTo(slide, dontAnimate = false) {
      this.slick.slickGoTo(slide, dontAnimate);
    },
  },

  render() {
    const props = { ...this.$props };
    const { $slots } = this;

    if (props.effect === 'fade') {
      props.fade = true;
    }

    const getPrefixCls = this.configProvider.getPrefixCls;
    let className = getPrefixCls('carousel', props.prefixCls);
    const dotsClass = 'slick-dots';
    const dotPosition = this.getDotPosition();
    props.vertical = dotPosition === 'left' || dotPosition === 'right';
    props.dotsClass = classNames(`${dotsClass}`, `${dotsClass}-${dotPosition || 'bottom'}`, {
      [`${props.dotsClass}`]: !!props.dotsClass,
    });
    if (props.vertical) {
      className = `${className} ${className}-vertical`;
    }
    const SlickCarouselProps = {
      ...props,
      ...this.$attrs,
      nextArrow: getComponent(this, 'nextArrow'),
      prevArrow: getComponent(this, 'prevArrow'),
    };
    return (
      <div class={className}>
        <SlickCarousel ref={this.saveSlick} {...SlickCarouselProps} vSlots={$slots}></SlickCarousel>
      </div>
    );
  },
};

/* istanbul ignore next */
Carousel.install = function(app) {
  app.component(Carousel.name, Carousel);
};

export default Carousel;