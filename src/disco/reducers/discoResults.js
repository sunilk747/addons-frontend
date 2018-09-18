/* @flow */
import { oneLine } from 'common-tags';
import invariant from 'invariant';

import log from 'core/logger';
import type {
  AddonType,
  AddonFileType,
  ExternalAddonType,
} from 'core/types/addons';

export const GET_DISCO_RESULTS: 'GET_DISCO_RESULTS' = 'GET_DISCO_RESULTS';
export const LOAD_DISCO_RESULTS: 'LOAD_DISCO_RESULTS' = 'LOAD_DISCO_RESULTS';

type ExternalDiscoAddonType = {|
  current_version: {|
    files: Array<AddonFileType>,
    compatibility: {
      [appName: string]: {|
        min: string,
        max: string,
      |},
    },
  |},
  guid: $PropertyType<ExternalAddonType, 'guid'>,
  icon_url: $PropertyType<ExternalAddonType, 'icon_url'>,
  id: $PropertyType<ExternalAddonType, 'id'>,
  name: $PropertyType<ExternalAddonType, 'name'>,
  previews: $PropertyType<ExternalAddonType, 'previews'>,
  slug: $PropertyType<ExternalAddonType, 'slug'>,
  theme_data: $PropertyType<ExternalAddonType, 'theme_data'>,
  type: $PropertyType<ExternalAddonType, 'type'>,
  url: $PropertyType<ExternalAddonType, 'url'>,
|};

type ExternalDiscoResultType = {|
  addon: ExternalDiscoAddonType,
  description: string | null,
  heading: string,
  is_recommendation: boolean,
|};

export type ExternalDiscoResultsType = {|
  count: number,
  results: Array<ExternalDiscoResultType>,
|};

type DiscoAddonType = {|
  ...ExternalDiscoAddonType,
  platformFiles: $PropertyType<AddonType, 'platformFiles'>,
  previewURL?: string,
|};

type DiscoResultType = {|
  addon: DiscoAddonType,
  description: string | null,
  heading: string,
  is_recommendation: boolean,
|};

export type DiscoResultsType = Array<DiscoResultType>;

type DiscoResultsState = {|
  results: DiscoResultsType,
  loading: boolean,
|};

export const initialState: DiscoResultsState = {
  loading: false,
  results: [],
};

type GetDiscoResultsParams = {|
  errorHandlerId: string,
  taarParams: {
    [name: string]: string,
    platform: string,
  },
|};

export type GetDiscoResultsAction = {|
  type: typeof GET_DISCO_RESULTS,
  payload: GetDiscoResultsParams,
|};

export function getDiscoResults({
  errorHandlerId,
  taarParams,
}: GetDiscoResultsParams = {}): GetDiscoResultsAction {
  invariant(errorHandlerId, 'errorHandlerId is required');
  invariant(taarParams.platform, 'taarParams.platform is required');

  return {
    type: GET_DISCO_RESULTS,
    payload: { errorHandlerId, taarParams },
  };
}

type LoadDiscoResultsParams = {|
  results: $PropertyType<ExternalDiscoResultsType, 'results'>,
|};

type LoadDiscoResultsAction = {|
  type: typeof LOAD_DISCO_RESULTS,
  payload: LoadDiscoResultsParams,
|};

export function loadDiscoResults({
  results,
}: LoadDiscoResultsParams = {}): LoadDiscoResultsAction {
  invariant(results, 'results are required');

  return {
    type: LOAD_DISCO_RESULTS,
    payload: { results },
  };
}

const createInternalAddon = (
  apiAddon: ExternalDiscoAddonType,
): DiscoAddonType => {
  const addon = {
    ...apiAddon,
    platformFiles: {
      all: undefined,
      android: undefined,
      linux: undefined,
      mac: undefined,
      windows: undefined,
    },
    previewURL: undefined,
  };

  if (apiAddon.theme_data) {
    addon.previewURL = apiAddon.theme_data.previewURL;
  }

  const currentVersion = apiAddon.current_version;
  if (currentVersion && currentVersion.files.length > 0) {
    currentVersion.files.forEach((file) => {
      // eslint-disable-next-line no-prototype-builtins
      if (!addon.platformFiles.hasOwnProperty(file.platform)) {
        log.warn(oneLine`Add-on ID ${apiAddon.id}, slug ${apiAddon.slug}
          has a file with an unknown platform: ${file.platform}`);
      }
      addon.platformFiles[file.platform] = file;
    });
  }

  return addon;
};

const createInternalResult = (
  apiResult: ExternalDiscoResultType,
): DiscoResultType => {
  return {
    addon: createInternalAddon(apiResult.addon),
    description: apiResult.description || null,
    heading: apiResult.heading,
    is_recommendation: apiResult.is_recommendation,
  };
};

type Action = LoadDiscoResultsAction | GetDiscoResultsAction;

export default function discoResults(
  state: DiscoResultsState = initialState,
  action: Action,
): DiscoResultsState {
  switch (action.type) {
    case GET_DISCO_RESULTS:
      return {
        ...state,
        loading: true,
      };
    case LOAD_DISCO_RESULTS: {
      const { results } = action.payload;

      return {
        ...state,
        loading: false,
        results: results.map(createInternalResult),
      };
    }
    default:
      return state;
  }
}
