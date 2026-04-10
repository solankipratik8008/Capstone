import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';

import { AppleSignInParams, UserRole } from '../constants';

const bytesToHex = (bytes: Uint8Array | number[]): string =>
  Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

const formatAppleName = (
  fullName?: AppleAuthentication.AppleAuthenticationFullName | null,
): string | undefined => {
  if (!fullName) {
    return undefined;
  }

  const value = [
    fullName.givenName,
    fullName.middleName,
    fullName.familyName,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  return value || undefined;
};

export const requestAppleSignIn = async (
  role: UserRole = UserRole.USER,
): Promise<AppleSignInParams> => {
  // Expo Go sends tokens with bundle ID "host.exp.Exponent", which Firebase
  // rejects. Guard here so callers don't need to know this constraint.
  if (Constants.appOwnership === 'expo') {
    throw Object.assign(
      new Error(
        'Apple Sign-In requires a development build. It is not available in Expo Go.',
      ),
      { code: 'ERR_EXPO_GO_NOT_SUPPORTED' },
    );
  }

  const rawNonce = bytesToHex(await Crypto.getRandomBytesAsync(16));
  const hashedNonce = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    rawNonce,
  );

  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
    nonce: hashedNonce,
  });

  if (!credential.identityToken) {
    throw new Error('No Apple identity token received.');
  }

  return {
    identityToken: credential.identityToken,
    nonce: rawNonce,
    email: credential.email,
    name: formatAppleName(credential.fullName),
    role,
  };
};

export const isAppleAuthCanceled = (error: unknown): boolean =>
  Boolean(
    typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED' ||
        (error as { code?: string }).code === 'ERR_CANCELED'),
  );
