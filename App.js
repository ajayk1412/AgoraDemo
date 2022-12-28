import React, {useRef, useState, useEffect} from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';

import {PermissionsAndroid, Platform} from 'react-native';
import {
  ClientRoleType,
  createAgoraRtcEngine,
  IRtcEngine,
  RtcSurfaceView,
  ChannelProfileType,
} from 'react-native-agora';
import VideoPlayer from 'react-native-video-controls';
const umutedImg = require('./assets/images/volume.png');
const mutedImg = require('./assets/images/noVolume.png');
const demoVideo = require('./assets/videos/video.mov');

const appId = '213305577b4c43e3a1f960218378be86';
const channelName = 'asdf';
const token =
  '007eJxTYLjefmPh8heauywrjJxU86evOMXzr2xxq9Ovr1W2PlUvnE4rMBgZGhsbmJqamyeZJJsYpxonGqZZmhkYGVoYm1skpVqY9XutSW4IZGSI4elnZmSAQBCfhSGxOCWNgQEAnZUflQ==';
const uid = 0;

const App = () => {
  const agoraEngineRef = useRef(); // Agora engine instance
  const [isJoined, setIsJoined] = useState(false); // Indicates if the local user has joined the channel
  const [remoteUid, setRemoteUid] = useState(0); // Uid of the remote user
  const [message, setMessage] = useState(''); // Message to the user
  const [mute, setMute] = useState(false); // Message to the user

  useEffect(() => {
    // Initialize Agora engine when the app starts
    setupVideoSDKEngine();
  });

  useEffect(() => {
    console.log('isJoined', isJoined);
  }, [isJoined]);

  const setupVideoSDKEngine = async () => {
    try {
      // use the helper function to get permissions
      if (Platform.OS === 'android') {
        await getPermission();
      }
      agoraEngineRef.current = createAgoraRtcEngine();
      const agoraEngine = agoraEngineRef.current;
      agoraEngine.registerEventHandler({
        onJoinChannelSuccess: () => {
          setIsJoined(true);
          showMessage('Successfully joined the channel ' + channelName);

          console.log('Successfully joined the channel ', channelName);
        },
        onUserJoined: (_connection, Uid) => {
          showMessage('Remote user joined with uid ' + Uid);
          setRemoteUid(Uid);
          console.log('Remote user joined with uid ', Uid);
        },
        onUserOffline: (_connection, Uid) => {
          showMessage('Remote user left the channel. uid: ' + Uid);
          setRemoteUid(0);
          console.log('Remote user left the channel. uid: ', Uid);
        },
      });

      agoraEngine.initialize({
        appId: appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });
      agoraEngine.enableVideo();
      console.log('agora intialization');
    } catch (e) {
      console.log('agora intialization error', e);
    }
  };

  const getPermission = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        PermissionsAndroid.PERMISSIONS.CAMERA,
      ]);
    }
  };

  const join = async () => {
    if (isJoined) {
      return;
    }
    try {
      agoraEngineRef.current?.setChannelProfile(
        ChannelProfileType.ChannelProfileCommunication,
      );
      agoraEngineRef.current?.startPreview();
      agoraEngineRef.current?.joinChannel(token, channelName, uid, {
        clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      });
    } catch (e) {
      console.log(e);
    }
  };
  const leave = () => {
    try {
      agoraEngineRef.current?.leaveChannel();
      setRemoteUid(0);
      setIsJoined(false);
      showMessage('You left the channel');
      console.log('You left the channel');
    } catch (e) {
      console.log(e);
    }
  };

  function showMessage(msg) {
    setMessage(msg);
  }

  // muted and unmuted functioanlity with muteLocalAudioStream takes true and false
  const onMuteUnmute = () => {
    agoraEngineRef.current.muteLocalAudioStream(!mute);
    setMute(!mute);
  };

  //   Volume slider  adjustRecordingSignalVolume takes (0-100) for minimum and max volume
  const onValueChange = value => {
    agoraEngineRef.current.adjustRecordingSignalVolume(value);
  };

  const renderVolumeView = () => {
    return (
      <View style={styles.volumeView}>
        <TouchableOpacity onPress={onMuteUnmute}>
          <Image source={!mute ? umutedImg : mutedImg} style={styles.icon} />
        </TouchableOpacity>

        {!mute && (
          <Slider
            style={{width: '60%'}}
            value={50}
            maximumValue={100}
            minimumValue={0}
            thumbTintColor={'black'}
            minimumTrackTintColor="black"
            maximumTrackTintColor="black"
            onValueChange={onValueChange}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.main}>
      <Text style={styles.head}>Agora Video Calling Quickstart</Text>
      <View style={styles.btnContainer}>
        <Text onPress={join} style={styles.button}>
          Join
        </Text>
        <Text onPress={leave} style={styles.button}>
          Leave
        </Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContainer}>
        {isJoined ? (
          <React.Fragment key={0}>
            <RtcSurfaceView canvas={{uid: 0}} style={styles.videoView} />
            <Text>Local user uid: {uid}</Text>
          </React.Fragment>
        ) : (
          <Text>Join a channel</Text>
        )}
        {isJoined && remoteUid !== 0 ? (
          <React.Fragment key={remoteUid}>
            <RtcSurfaceView
              canvas={{uid: remoteUid}}
              style={styles.videoView}
            />
            <Text>Remote user uid: {remoteUid}</Text>
          </React.Fragment>
        ) : (
          <Text>Waiting for a remote user to join</Text>
        )}
        <Text style={styles.info}>{message}</Text>

        {/* render volume adjustment and muted and unmuted */}
        {isJoined && renderVolumeView()}

        <VideoPlayer
          style={styles.videoPlayerStyle}
          source={demoVideo}
          resizeMode="contain"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 25,
    paddingVertical: 4,
    fontWeight: 'bold',
    color: '#ffffff',
    backgroundColor: '#0055cc',
    margin: 5,
  },
  main: {flex: 1, alignItems: 'center'},
  scroll: {flex: 1, backgroundColor: '#ddeeff', width: '100%'},
  scrollContainer: {alignItems: 'center'},
  videoView: {width: '40%', height: 200},
  btnContainer: {flexDirection: 'row', justifyContent: 'center'},
  head: {fontSize: 20},
  info: {backgroundColor: '#ffffe0', color: '#0000ff'},
  icon: {height: 40, width: 40},
  volumeView: {flexDirection: 'row', alignItems: 'center'},
  videoPlayerStyle: {height: 200, width: '100%'},
});

export default App;
