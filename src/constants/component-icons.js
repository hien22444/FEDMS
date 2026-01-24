import { NodeType } from '.';
import {
  IcButton,
  IcImage,
  IcLink,
  IcNavigation,
  IcSearchSeo,
  IcSection,
  IcStar,
  IcText,
  IcTextarea,
} from './icons';

export const NodeTypeIcons = {
  [NodeType.TEXT]: IcText,
  [NodeType.BUTTON]: IcButton,
  [NodeType.IMAGE]: IcImage,
  [NodeType.SECTION]: IcSection,
  [NodeType.STREAM_SECTION]: IcStar,
  [NodeType.NAVIGATION]: IcNavigation,
  [NodeType.LINK]: IcLink,
  [NodeType.TEXTAREA]: IcTextarea,
  [NodeType.METADATA]: IcSearchSeo,
};
