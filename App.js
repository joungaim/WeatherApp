import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import axios from "axios";
import moment from "moment";
import UltStrWeather from "./UltStrWeather";
import Loading from "./Loading";

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  /**
   * 단기예보조회용 변수
   */
  const [srtBaseDate, setSrtBaseDate] = useState(null);
  const [srtBaseTime, setSrtBaseTime] = useState("0200");
  const [srtWeatherObj, setSrtWeatherObj] = useState({});

  /**
   * 초단기실황조회용 변수
   */
  const [ultraSrtBaseDate, setUltraSrtBaseDate] = useState(null);
  const [ultraSrtBaseTime, setUltraSrtBaseTime] = useState("0000");
  const [ultSrtWeatherObj, setUltSrtWeatherObj] = useState({});

  let [addrObj, setAddrObj] = useState({});

  // 날씨 데이터
  const [pop, setPop] = useState(); // 강수확률 단위 : %
  const [pty, setPty] = useState(); // 강수형태
  const [pcp, setPcp] = useState(); // 1시간 강수량
  const [reh, setReh] = useState(); // 습도 단위 : %
  const [sno, setSno] = useState(); // 1시간 신적설(눈 쌓인 양)
  const [sky, setSky] = useState(); // 하늘상태
  const [tmp, setTmp] = useState(); // 1시간 기온 단위 :℃
  const [tmn, setTmn] = useState(); // 일 최저기온 단위 :℃
  const [tmx, setTmx] = useState(); // 일 최고기온 단위 :℃
  const [uuu, setUuu] = useState(); // 풍속(동서성분) : m/s
  const [vvv, setVvv] = useState(); // 풍속(남북성분) : m/s
  const [vec, setVec] = useState(); // 풍향 : deg
  const [wsd, setWsd] = useState(); // 풍속 : m/s
  // 날씨 데이터

  getTime = async () => {
    let todayDate = moment().format("YYYYMMDD");
    let currentTime = moment().format("HHmm"); //현재 시간분 (HH:24h / hh:12h)
    let yesterdayDate = moment().subtract(1, "days"); // 어제날짜 구하기
    yesterdayDate = moment(yesterdayDate).format("YYYYMMDD"); // 어제날짜 포맷 재 설정

    let srtBaseTime;
    let ultraSrtBaseTime;

    setSrtBaseDate(todayDate);
    setUltraSrtBaseDate(todayDate);

    /**
     * [단기예보조회용 날짜/시간 세팅]
     * 기상청 정보는 1일 총 8번 업데이트 된다.(0200, 0500, 0800, 1100, 1400, 1700, 2000, 2300)
     * moment(currentTime).isBetween("1200", "0210") : 1200 <= currentTime < 0210 : 1200은 포함되고 (true) 0210은 포함되지 않음(flase)
     */
    if (moment(currentTime).isBetween("1200", "0211")) {
      // 0시~2시 10분 사이 : base_date가 어제 날짜로 바뀌어야 한다.
      setSrtBaseDate(yesterdayDate);
      srtBaseTime = "2300";
    } else if (moment(currentTime).isBetween("0211", "0511")) {
      // 2시 11분~5시 10분 사이
      srtBaseTime = "0200";
    } else if (moment(currentTime).isBetween("0511", "0811")) {
      // 5시 11분~8시 10분 사이
      srtBaseTime = "0500";
    } else if (moment(currentTime).isBetween("0811", "1111")) {
      // 8시 11분~11시 10분 사이
      srtBaseTime = "0800";
    } else if (moment(currentTime).isBetween("1111", "1411")) {
      // 11시 11분~14시 10분 사이
      srtBaseTime = "1100";
    } else if (moment(currentTime).isBetween("1411", "1711")) {
      // 14시 11분~17시 10분 사이
      srtBaseTime = "1400";
    } else if (moment(currentTime).isBetween("1711", "2011")) {
      // 17시 11분~20시 10분 사이
      srtBaseTime = "1700";
    } else if (moment(currentTime).isBetween("2011", "2311")) {
      // 20시 11분~23시 10분 사이
      srtBaseTime = "2000";
    } else {
      // 23시 11분~23시 59분
      srtBaseTime = "2300";
    }
    setSrtBaseTime(srtBaseTime);

    /**
     * [초단기실황조회용 날짜/시간 세팅]
     * 매시간 정각 40분 후에 조회 가능. 예) 12시 데이터는 12시 41분부터 / 1시 데이터는 1시 41분부터 조회 가능
     */
    if (moment(currentTime).isBetween("0041", "0140")) {
      ultraSrtBaseTime = "0000";
    } else if (moment(currentTime).isBetween("0141", "0240")) {
      ultraSrtBaseTime = "0100";
    } else if (moment(currentTime).isBetween("0241", "0340")) {
      ultraSrtBaseTime = "0200";
    } else if (moment(currentTime).isBetween("0341", "0440")) {
      ultraSrtBaseTime = "0300";
    } else if (moment(currentTime).isBetween("0441", "0540")) {
      ultraSrtBaseTime = "0400";
    } else if (moment(currentTime).isBetween("0541", "0640")) {
      ultraSrtBaseTime = "0500";
    } else if (moment(currentTime).isBetween("0641", "0740")) {
      ultraSrtBaseTime = "0600";
    } else if (moment(currentTime).isBetween("0741", "0840")) {
      ultraSrtBaseTime = "0700";
    } else if (moment(currentTime).isBetween("0841", "0940")) {
      ultraSrtBaseTime = "0800";
    } else if (moment(currentTime).isBetween("0941", "1040")) {
      ultraSrtBaseTime = "0900";
    } else if (moment(currentTime).isBetween("1041", "1140")) {
      ultraSrtBaseTime = "1000";
    } else if (moment(currentTime).isBetween("1141", "1240")) {
      ultraSrtBaseTime = "1100";
    } else if (moment(currentTime).isBetween("1241", "1340")) {
      ultraSrtBaseTime = "1200";
    } else if (moment(currentTime).isBetween("1341", "1440")) {
      ultraSrtBaseTime = "1300";
    } else if (moment(currentTime).isBetween("1441", "1540")) {
      ultraSrtBaseTime = "1400";
    } else if (moment(currentTime).isBetween("1541", "1640")) {
      ultraSrtBaseTime = "1500";
    } else if (moment(currentTime).isBetween("1641", "1740")) {
      ultraSrtBaseTime = "1600";
    } else if (moment(currentTime).isBetween("1741", "1840")) {
      ultraSrtBaseTime = "1700";
    } else if (moment(currentTime).isBetween("1841", "1940")) {
      ultraSrtBaseTime = "1800";
    } else if (moment(currentTime).isBetween("1941", "2040")) {
      ultraSrtBaseTime = "1900";
    } else if (moment(currentTime).isBetween("2041", "2140")) {
      ultraSrtBaseTime = "2000";
    } else if (moment(currentTime).isBetween("2141", "2240")) {
      ultraSrtBaseTime = "2100";
    } else if (moment(currentTime).isBetween("2241", "2340")) {
      ultraSrtBaseTime = "2200";
    } else {
      // 2341 ~ 0040
      ultraSrtBaseTime = "2300";
    }

    setUltraSrtBaseTime(ultraSrtBaseTime);
  };

  /**
   * 1. 위도, 경도 얻은 후
   * 2. getAddress 호출하여 한글 주소 얻음
   * 3. 위,경도를 getGridGPS 호출하여 좌표값으로 바꾼후 getWeather 호출
   */
  getLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});

    console.log(location.coords.latitude + "/" + location.coords.longitude);
    setLatitude(location.coords.latitude);
    setLongitude(location.coords.longitude);

    getAddress(location.coords.latitude, location.coords.longitude);

    const rs = await getGridGPS(); // 위도,경도를 기상청 api에 활용 가능한 x,y로 바꾸는 함수
    getWeather(rs.x, rs.y); // 좌표 값 사용하여 날씨데이터 받아오는 함수
  };

  /**
   * 한글 주소 얻음
   */
  getAddress = async (latitude, longitude) => {
    const worldOpenkey = "D2914382-1CF1-340A-B872-29911F460AEF";
    const url = `http://api.vworld.kr/req/address?service=address&request=getAddress&version=2.0&crs=epsg:4326&point=${longitude},${latitude}&format=json&type=PARCEL&zipcode=false&simple=true&key=${worldOpenkey}`;
    console.log(url);

    await axios
      .get(url)
      .then(function (response) {
        const addrGu = response.data.response.result[0].structure.level2; // 구 이름
        const addrDong = response.data.response.result[0].structure.level4L; // 동 이름
        setAddrObj({
          addrGu,
          addrDong,
        });
      })
      .catch(function (error) {
        console.log("실패 : " + error);
      });
  };

  // 위,경도 -> 좌표변환 함수
  getGridGPS = async () => {
    // 위,경도 -> 좌표변환 하기 위한 기본값
    const RE = 6371.00877; // 지구 반경(km)
    const GRID = 5.0; // 격자 간격(km)
    const SLAT1 = 30.0; // 투영 위도1(degree)
    const SLAT2 = 60.0; // 투영 위도2(degree)
    const OLON = 126.0; // 기준점 경도(degree)
    const OLAT = 38.0; // 기준점 위도(degree)
    const XO = 43; // 기준점 X좌표(GRID)
    const YO = 136; // 기1준점 Y좌표(GRID)
    //

    var DEGRAD = Math.PI / 180.0;
    var RADDEG = 180.0 / Math.PI;

    var re = RE / GRID;
    var slat1 = SLAT1 * DEGRAD;
    var slat2 = SLAT2 * DEGRAD;
    var olon = OLON * DEGRAD;
    var olat = OLAT * DEGRAD;

    var sn =
      Math.tan(Math.PI * 0.25 + slat2 * 0.5) /
      Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
    var sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
    sf = (Math.pow(sf, sn) * Math.cos(slat1)) / sn;
    var ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
    ro = (re * sf) / Math.pow(ro, sn);
    var rs = {};

    rs["lat"] = latitude; // 객체 rs에 "lat"를 이름으로 하는 key 를 생성하고, 변수 latitude을 value로 할당한다.
    rs["lng"] = longitude; // 객체 rs에 "lng"를 이름으로 하는 key 를 생성하고, 변수 longitude을 value로 할당한다.
    var ra = Math.tan(Math.PI * 0.25 + latitude * DEGRAD * 0.5);
    ra = (re * sf) / Math.pow(ra, sn);
    var theta = longitude * DEGRAD - olon;
    if (theta > Math.PI) theta -= 2.0 * Math.PI;
    if (theta < -Math.PI) theta += 2.0 * Math.PI;
    theta *= sn;
    rs["x"] = Math.floor(ra * Math.sin(theta) + XO + 0.5);
    rs["y"] = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

    return rs;
  };

  // nx,ny : 위,경도를 좌표로 바꾼 각각의 값
  getWeather = async (nx, ny) => {
    const API_KEY =
      "Skm8Sx%2BhuSd8PBsZeDzGPZVXFlXODLxEJR2MRRajPQqn1aID2DYuEYoMC97NhdpJ4AzetqrX2xTDHtIUKnTX1g%3D%3D";

    /**
     * [단기예보조회용 HTTP 비동기 통신 ]
     */
    (getSrtWeather = async () => {
      const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst?serviceKey=${API_KEY}&numOfRows=10&pageNo=1&dataType=JSON&base_date=${srtBaseDate}&base_time=${srtBaseTime}&nx=${nx}&ny=${ny}`;
      await axios
        .get(url)
        .then(function (response) {
          const WeatherResponseData = response.data.response.body.items.item; //필요한 정보만 받아오기 전부 다 받아 오려면 response.data 까지만 적는다.
          setSrtWeatherObj(WeatherResponseData);
          // WeatherResponseData.map(function (arr, i) {
          //   setSrtWeatherObj ({
          //     category = arr.category,
          //   })
          // });
        })
        .catch(function (error) {
          console.log("실패 : " + error);
        });
    })();

    /**
     * [초단기실황조회용 HTTP 비동기 통신 ]
     */
    (getUltSrtWeather = async () => {
      const url = `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getUltraSrtNcst?serviceKey=${API_KEY}&numOfRows=10&pageNo=1&base_date=${ultraSrtBaseDate}&base_time=${ultraSrtBaseTime}&nx=${nx}&ny=${ny}&dataType=JSON`;
      await axios
        .get(url)
        .then(function (response) {
          const WeatherResponseData = response.data.response.body.items.item;
          setUltSrtWeatherObj(WeatherResponseData);

          // WeatherResponseData.map(function (arr, i) {
          //   console.log("getUltSrtWeather :" + arr.category);
          // });
        })
        .catch(function (error) {
          console.log("실패 : " + error);
        });
    })();
    setIsLoading(false);
  };
  console.log(ultSrtWeatherObj[0]);

  // 클래스 생명주기 메서드 중 componentDidMount() 와 동일한 기능을 한다.
  // useEffect는첫번째 렌더링과 이후의 모든 업데이트에서 수행됩니다.
  useEffect(() => {
    getTime();
    getLocation();
  }, []);
  // 빈 배열을 넣어 주면 처음 랜더링 될 때 한번만 실행 된다. 넣지 않으면 모든 업데이트에서 실행되며
  // 배열안에 [count] 같이 인자를 넣어주면 해당 인자가 업데이트 될 때 마다 실행된다.

  return isLoading ? (
    <Loading />
  ) : (
    <View style={styles.container}>
      <UltStrWeather weatherObj={ultSrtWeatherObj[0]} />
      <Text>
        주소 : {addrObj.addrGu} {addrObj.addrDong} /
      </Text>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});
