// ==UserScript==
// @name         🥇【华医网小助手】全网唯一真实免费|无人值守|自动静音|视频助手|考试助手
// @namespace    http://tampermonkey.net/
// @version      1.1.2
// @description  1.倍速播放（已失效）；2.视频助手；3.考试助手（试错算法仅面向可多次提交的考试）；4.双模选择：单刷视频or视频+考试；5.屏蔽或者跳过课堂签到、提醒、疲劳
// @author       二创作者：境界程序员   原创作者：Dr.S
// @license      AGPL License
// @match        *://*.91huayi.com/course_ware/course_ware_polyv.aspx?*
// @match        *://*.91huayi.com/course_ware/course_ware_cc.aspx*
// @match        *://*.91huayi.com/pages/exam.aspx?*
// @match        *://*.91huayi.com/pages/exam_result.aspx?*
// @match        *://*.91huayi.com/*
// @grant        none
// @downloadURL https://update.greasyfork.org/scripts/483418/%F0%9F%A5%87%E3%80%90%E5%8D%8E%E5%8C%BB%E7%BD%91%E5%B0%8F%E5%8A%A9%E6%89%8B%E3%80%91%E5%85%A8%E7%BD%91%E5%94%AF%E4%B8%80%E7%9C%9F%E5%AE%9E%E5%85%8D%E8%B4%B9%7C%E6%97%A0%E4%BA%BA%E5%80%BC%E5%AE%88%7C%E8%87%AA%E5%8A%A8%E9%9D%99%E9%9F%B3%7C%E8%A7%86%E9%A2%91%E5%8A%A9%E6%89%8B%7C%E8%80%83%E8%AF%95%E5%8A%A9%E6%89%8B.user.js
// @updateURL https://update.greasyfork.org/scripts/483418/%F0%9F%A5%87%E3%80%90%E5%8D%8E%E5%8C%BB%E7%BD%91%E5%B0%8F%E5%8A%A9%E6%89%8B%E3%80%91%E5%85%A8%E7%BD%91%E5%94%AF%E4%B8%80%E7%9C%9F%E5%AE%9E%E5%85%8D%E8%B4%B9%7C%E6%97%A0%E4%BA%BA%E5%80%BC%E5%AE%88%7C%E8%87%AA%E5%8A%A8%E9%9D%99%E9%9F%B3%7C%E8%A7%86%E9%A2%91%E5%8A%A9%E6%89%8B%7C%E8%80%83%E8%AF%95%E5%8A%A9%E6%89%8B.meta.js
// ==/UserScript==

//更新历史
//■2023.12.1调整默认播放速度5倍（仅首次登录起效，后续以用户更改过的倍速保存），免得用户感觉不到脚本在运行
//■2023.12.3优化了视频播放逻辑，能够自动切换下一个视频，而不是播完1个就卡在考试认证处（也导致了不修改代码就无法进入考试）
//■2023.12.15新增模式切换，可以选择先单刷视频（无人值守），刷完再打开考试开关，就可以连续考试了
//■2023.12.21将脚本控制台上移到显眼的位置，方便用户操作；增加生效的倍速按钮变色(删除了原先的文字提醒)
//■2023.12.24优化了倍速调整的逻辑，无需刷新网页
//■2023.12.25添加了网页静音代码，润物细无声
//■2024.1.11在人脸识别页面增加温馨提醒，考试功能仅为答案遍历，而非自动搜索答案
//■2024.4.15修复了不自动切换视频的问题（因网站版本限制，目前脚本倍速已失效）
//■2024.4.28由于与用户无法取得联系，在页面上增加了反馈机制的说明
//■2024.6.3尝试修复CC播放器和保利威播放器加载事件bug
//■2024.6.5增加视频过程中对温馨提示（疲劳）的检测
//■2024.6.7根据赞赏和评论区反馈，修复了一种视频意外暂停的情况


(function () {
    'use strict';
    var submitTime = 6100;//交卷时间控制
    var reTryTime = 2100;//重考,视频进入考试延时控制
    var examTime = 10000;//听课完成进入考试延时
    var randomX = 5000;//随机延时上限
    var vSpeed = 1; //首次使用脚本的默认播放速度
    var autoSkip = false; //一个可能会封号的功能。
    //记录字段
    var keyPlayRate = "JJ_Playrate";
    var keyTest = "JJ_Test";
    var keyResult = "JJ_Result";
    var keyThisTitle = "JJ_ThisTitle";
    var keyTestAnswer = "JJ_TestAnswer";
    var keyRightAnswer = "JJ_RightAnswer";
    var keyAllAnswer = "JJ_AllAnswer";
    //按钮样式
    var btstyleA = "font-size: 16px;font-weight: 300;text-decoration: none;text-align: center;line-height: 40px;height: 40px;padding: 0 40px;display: inline-block;appearance: none;cursor: pointer;border: none;box-sizing: border-box;transition-property: all;transition-duration: .3s;background-color: #4cb0f9;border-color: #4cb0f9;border-radius: 4px;margin: 5px;color: #FFF;";
    var btstyleB = "font-size: 12px;font-weight: 300;text-decoration: none;text-align: center;line-height: 20px;height: 20px;padding: 0 5px;display: inline-block;appearance: none;cursor: pointer;border: none;box-sizing: border-box;transition-property: all;transition-duration: .3s;background-color: #4cb0f9;border-color: #4cb0f9;border-radius: 4px;margin: 5px;color: #FFF;";
    var btstyleC = "font-size: 12px;font-weight: 300;text-decoration: none;text-align: center;line-height: 20px;height: 20px;padding: 0 5px;display: inline-block;appearance: none;cursor: pointer;border: none;box-sizing: border-box;transition-property: all;transition-duration: .3s;background-color: #f15854;border-color: #f15854;border-radius: 4px;margin: 5px;color: #FFF;";
    //页面判别
    var urlInfos = window.location.href.split("/");
    var urlTip = urlInfos[urlInfos.length - 1].split("?")[0];
    var huayi = getHuayi();
    var nspeed = 0;


    if (urlTip == "course_ware_polyv.aspx") { //保利威播放器视频页面
        console.log("当前任务: 华医看视频");
        huayi.seeVideo(1);
    } else if (urlTip == "course_ware_cc.aspx") { //CC播放器视频页面
        console.log("当前任务: 华医看视频");
        huayi.seeVideo(2);
    } else if (urlTip == "exam.aspx") { //考试页面
        console.log("当前任务: 华医考试");
        huayi.doTest();
    } else if (urlTip == "course.aspx" || urlTip == "cme.aspx") { //课程列表页面
        console.log("当前任务: 课程列表");
        huayi.courseList();
    } else if (urlTip == "exam_result.aspx") { //考试结果页面
        console.log("当前任务: 华医考试结果审核");
        huayi.doResult();
    } else {
        console.log("其它情况");
    };

    function getHuayi() {
        return {
            courseList: function () {
                addAnwserCopybtn();
                DelAllAnwser();

            },
            seeVideo: function (e) {
                var tr = localStorage.getItem(keyPlayRate);
                //console.log("存储读取" + tr);//读取倍速
                var playRateNow = tr ? tr : vSpeed;

                cleanKeyStorage();



                asynckillsendQuestion();//屏蔽课堂问答的函数；
                killsendQuestion2();//屏蔽课堂问答的函数2；

                killsendQuestion3(); //循环检测问答对话框是否弹出。

                addrateinfo();//插入一些按钮
                addratebtn(1);
                addratebtn(1.5);
                addratebtn(2);
                addratebtn(3);
                addratebtn(5);
                addratebtn(10);
                //addSkipbtn();//跳过按钮
                addinfo();//脚本信息
                changelayout();
                //速度调节部分

                window.onload = function () {
                    localStorage.setItem(keyThisTitle, JSON.stringify(window.document.title));//储存章节标题
                    // console.log("准备激活加速");
                    ratechg(playRateNow);
                    if (autoSkip == true) {//秒过功能，签完别尝试
                        setTimeout(function () {
                            skipVideo();
                        }, (submitTime + Math.ceil(Math.random() * randomX)));
                        console.log("秒过了！");

                    };
                    setInterval(examherftest, 11000);//阿み杰此处要改11才能考试，循环法用examherftest检测考试按钮是否能点击
                    // try {
                    //     videoObj.onended = function () {
                    //         console.log("播放完成，准备进入考试");
                    //         // if (document.querySelector("a[id='mode']").innerText != "当前模式：视频+考试\n[点击此处切换]") {
                    //         clickexam();//阿み杰不想考试
                    //         // };
                    //     };
                    // } catch (error) { console.log("播放器1检测错误"); }

                    switch (e) {
                        case 1:
                            window.s2j_onPlayerInitOver()
                            {
                                console.log("polyv加载完毕，静音，稍后尝试触发一次播放");
                                document.querySelector("video").defaultMuted = true;
                                setTimeout(function () {
                                    try {
                                        document.querySelector("video").volume = 0;//实际测试，主要靠这一条静音
                                        player.j2s_resumeVideo();
                                        document.querySelector("video").muted = true;
                                        examherftest();
                                        document.querySelector("button[onclick='closeBangZhu()']").click();//关闭温馨提醒
                                    } catch (error) {
                                        console.log("上一段代码有误");
                                    };
                                }, 2000); //延时点击播放，之前是5秒
                            };
                            break;
                        case 2:
                            window.on_CCH5player_ready()
                            {
                                console.log("CCplayer加载完毕，静音，稍后尝试触发一次播放");
                                document.querySelector("video").defaultMuted = true;
                                setTimeout(function () {
                                    try {
                                        document.querySelector("video").volume = 0;//实际测试，主要靠这一条静音
                                        cc_js_Player.play();
                                        document.querySelector("video").muted = true;
                                        examherftest();
                                        document.querySelector("button[onclick='closeBangZhu()']").click();//关闭温馨提醒
                                    } catch (error) {
                                        console.log("上一段代码有误");
                                    };
                                }, 2000); //延时点击播放，之前是5秒
                            };
                            break;
                        default:
                            console.log("其他播放器？");
                    };

                };
            },
            doTest: function () {
                var questions = JSON.parse(localStorage.getItem(keyTest)) || {};
                var qRightAnswer = JSON.parse(localStorage.getItem(keyRightAnswer)) || {};
                if (JSON.stringify(qRightAnswer) == "{}") {
                    qRightAnswer = LoadRightAnwser();
                };
                var qTestAnswer = {};

                var hy_questions = document.querySelectorAll('.test table');
                let i = 0;
                while(i < hy_questions.length) {
                    // var question = document.querySelector(".q_name");
                    let question = hy_questions[i].querySelector(".q_name");
                    let answer_element = hy_questions[i].querySelector("tbody")

                    console.log("问题:"+ question.innerText);
                    if (question == null) break;
                    else {
                        var q = question.innerText.substring(2).replace(/\s*/g, "");
                        //thisQuestions=thisQuestions+q+"@"
                        console.log(q);
                        console.log(qRightAnswer);


                        if (qRightAnswer.hasOwnProperty(q)) { //当查询到记录了正确答案时的操作

                            console.log("问题:"+ q + ",有答案:"+ qRightAnswer[q]);
                            var rightSelection = findAnwserWithElement(answer_element, qRightAnswer[q]) //返回答案选项id
                            rightSelection.click();

                        } else {
                            if (questions.hasOwnProperty(q)) {
                                questions[q] = getNextChoice(questions[q]);
                                console.log("不知道答案:"+ q+"，测试："+questions[q]);
                            } else { //如果系统没有记录
                                questions[q] = "A";
                            };

                            var answer = getChoiceCode(questions[q]);
                            var element = findAnwserElementWithElement(answer_element, questions[q]);


                            if (!element) { //选项除错机制
                                questions[q] = "A";
                                answer = getChoiceCode("A");
                                element = findAnwserElementWithElement(answer_element, questions[q])
                                //localStorage.removeItem(keyTest)
                            };
                            try {
                                var answerText = element.innerText.trim().substring(2); //获得当前答案文本
                                qTestAnswer[q] = answerText;
                                //console.log("qTestAnswer："+error);
                            } catch (error) { console.log("答案文本获取失败A：" + error); };
                            element.click();
                        };
                        i++;
                    };
                };

                //存储相关记录

                localStorage.setItem(keyTest, JSON.stringify(questions));
                localStorage.setItem(keyTestAnswer, JSON.stringify(qTestAnswer));

                setTimeout(function () {
                    document.querySelector("#btn_submit").click();
                }, (submitTime + Math.ceil(Math.random() * randomX))); //交卷延时
                ///专用函数区
                function findAnwser(qakey, rightAnwserText) {
                    var answerslist = document.querySelector(qakey);
                    var arr = answerslist.getElementsByTagName("label");

                    for (var i = 0; i < arr.length; i++) {
                        //console.log(arr[i].innerText);
                        if (arr[i].innerText.substring(2) == rightAnwserText) {
                            return arr[i].htmlFor;
                        };
                    };
                };

                function findAnwserWithElement(qaElement, rightAnwserText) {
                    var arr = qaElement.getElementsByTagName("label");

                    for (var i = 0; i < arr.length; i++) {
                        //console.log(arr[i].innerText);
                        if (arr[i].innerText.trim().substring(2) == rightAnwserText) {
                            return arr[i];
                        };
                    };
                };
                function findAnwserElementWithElement(qaElement, rightAnwserText) {
                    var arr = qaElement.getElementsByTagName("label");

                    for (var i = 0; i < arr.length; i++) {
                        //console.log(arr[i].innerText);
                        if (arr[i].innerText.trim().substring(0,1) == rightAnwserText) {
                            return arr[i];
                        };
                    };
                };

                function getChoiceCode(an) { //用于获取选项字符编码
                    var charin = an || "A";
                    return charin.charCodeAt(0) - "A".charCodeAt(0);

                };

                function getNextChoice(an) { //用于获取下一个选项字符
                    var code = an.charCodeAt(0) + 1;
                    return String.fromCharCode(code);
                };
                ///专用函数区结束
            },
            doResult: function () {
                //var res = document.getElementsByTagName("b")[0].innerText;
                //var dds = document.getElementsByTagName("dd");
                var res = $(".tips_text")[0].innerText;
                const dds = document.querySelectorAll('.state_cour_lis');

                localStorage.removeItem(keyResult);//移除错题表缓存
                if (res == "考试通过" || res == "考试通过！" || res == "完成项目学习可以申请学分了") { //考试通过
                    console.log("考试通过");
                    //localStorage.setItem(keyResult, "");//记录最后一次答对的题目。
                    saveRightAnwser();//记录最后一次答对的题目。
                    SaveAllAnwser(); //存储所有记录的答案
                    cleanKeyStorage();//如果通过清理答案

                    var next = document.querySelector(".state_lis_han");
                    if (next) {
                        setTimeout(function () { next.click(); }, 1000);//下一节课延时
                    };
                } else { //考试没过
                    console.log("考试未通过")
                    document.querySelector("p[class='tips_text']").innerText = "本次未通过，正在尝试更换答案\r\n（此为正常现象，脚本几秒后刷新，请勿操作）"

                    var qWrong = {};
                    for (var i = 0; i < dds.length; ++i) {
                        const img = dds[i].querySelector('img');
                        let question = dds[i].querySelector('p');

                        if(!img.src.includes('bar_img.png')) {
                            qWrong[question.title.replace(/\s*/g, "")] = i
                        }

                    };

                    if (qWrong != {}) {
                        localStorage.setItem(keyResult, JSON.stringify(qWrong));
                        saveRightAnwser();
                        setTimeout(function () {
                            $("input[type=button][value='重新考试']").click();
                        }, (reTryTime + Math.ceil(Math.random() * randomX)) * 1);

                        //重新考试
                    };
                };

            },
        };
    };

    //---------------------------------全局函数区------------------------------//
    //答案记录函数区开始//
    function SaveAllAnwser() {//保存历史题目答案
        var qAllAnswer = JSON.parse(localStorage.getItem(keyAllAnswer)) || {};
        var qRightAnswer = JSON.parse(localStorage.getItem(keyRightAnswer)) || {};
        var qTitle = JSON.parse(localStorage.getItem(keyThisTitle)) || "没有记录到章节名称";
        var qOldAnswer = qAllAnswer[qTitle] || {};
        for (var q in qRightAnswer) {
            qOldAnswer[q] = qRightAnswer[q];
        };
        qAllAnswer[qTitle] = qOldAnswer;

        if (qAllAnswer != null) {//保存正确答案
            localStorage.setItem(keyAllAnswer, JSON.stringify(qAllAnswer));
        };
    };
    function LoadRightAnwser() {//加载历史题目答案
        var qAllAnswer = JSON.parse(localStorage.getItem(keyAllAnswer)) || {};
        //var qRightAnswer = JSON.parse(localStorage.getItem(keyRightAnswer)) ||{};
        var qTitle = JSON.parse(localStorage.getItem(keyThisTitle)) || "没有记录到章节名称";
        if (qTitle == "没有记录到章节名称") {
            return {};
        };
        var qOldAnswer = qAllAnswer[qTitle] || {};
        return qOldAnswer
    };
    function saveRightAnwser() { //记录本次测试到的正确答案

        var qRightAnswer = JSON.parse(localStorage.getItem(keyRightAnswer)) || {};
        var qTestAnswer = JSON.parse(localStorage.getItem(keyTestAnswer)) || {};
        var qkeyTest = JSON.parse(localStorage.getItem(keyTest)) || {};

        //错题表
        var qWrongs = JSON.parse(localStorage.getItem(keyResult)) || {};

        for (var q in qTestAnswer) {
            console.log("题目：" + q + "，答案：" + qTestAnswer[q]);
            //debugger;
            var iswrong = false;
            if (!qWrongs.hasOwnProperty(q)) { //当查询到记录了正确答案时的操作
                console.log("正确的题目：" + q + "，答案：" + qTestAnswer[q]);
                qRightAnswer[q] = qTestAnswer[q];
            } //else{ console.log("错误的题目："+q+"，答案："+qTestAnswer[q]);}

        };
        localStorage.removeItem(keyTestAnswer);//清理临时记录
        if (qRightAnswer != null) {//保存正确答案
            localStorage.setItem(keyRightAnswer, JSON.stringify(qRightAnswer));
        };
    };
    //答案记录函数区结束//

    //答案复制相关按钮
    function addAnwserCopybtn() {//插入答案复制按钮
        let alink = document.createElement("a");
        alink.innerHTML = '显示已记录答案';
        alink.style = btstyleB;

        alink.onclick = function (event) {
            var qAllAnswer = JSON.parse(localStorage.getItem(keyAllAnswer)) || {};
            var Aout = JSON.stringify(qAllAnswer, null, "\t")
            //Aout=encodeURIComponent(Aout);
            //window.prompt("请复制",Aout);
            if (document.getElementById("AnwserOut")) {
                document.getElementById("AnwserOut").innerHTML = Aout;
            } else {
                let textout = document.createElement("textarea");
                textout.id = "AnwserOut";
                textout.innerHTML = Aout;
                textout.rows = 20;
                textout.cols = 30;
                document.getElementById("main_div").parentNode.append(textout);
            };

        };
        document.getElementById("main_div").parentNode.append(alink);

    };
    function DelAllAnwser() {//插入清除答案按钮
        let alink = document.createElement("a");
        alink.innerHTML = '清除已记录答案';
        alink.style = btstyleB;

        alink.onclick = function (event) {

            var r = confirm("确定清除历史答案？!");
            if (r) {
                localStorage.removeItem(keyAllAnswer);
            };
        };
        document.getElementById("main_div").parentNode.append(alink);
    };
    //答案复制相关按钮 end
    function skipVideo() {//这是跳过视频的代码
        var oVideo = document.getElementsByTagName('video')[0];
        if (oVideo) {
            oVideo.currentTime = oVideo.duration - 1
        };
    };

    function clickexam() { //延时点击考试按钮。
        console.log("已点击考试按钮");
        setTimeout(function () {
            document.querySelector("#jrks").click();
        }, (Math.ceil(Math.random() * randomX)));
        //}, (examTime + Math.ceil(Math.random() * randomX)));
    };
    //按钮插入函数相关
    function addSkipbtn() {//插入按钮快进视频按钮
        let alink = document.createElement("a");
        alink.innerHTML = '快进视频';
        alink.style = btstyleA;

        alink.onclick = function (event) {
            skipVideo();
        };
        document.querySelector("div[id='jj']").parentNode.append(alink);
    };

    function addratebtn(ra) {//倍率调整按钮
        let alink = document.createElement("a");
        alink.innerHTML = '' + ra + 'x';
        alink.style = btstyleB;
        alink.className = "speed";
        alink.id = ra + "x";
        alink.onclick = function (event) {
            ratechg(ra);
            try {
                var arr = document.querySelectorAll("a[class='speed']");
                arr.forEach(function (item, index, arr) {
                    arr[index].style = btstyleB;
                });
            } catch (error) {
            };
            alink.style = btstyleC;
        };
        document.querySelector("div[id='jj']").parentNode.append(alink);
    }
    function ratechg(ra) {//倍率调整
        var videoObj = document.querySelector("video")
        try {
            clearInterval(nspeed);
            nspeed = setInterval(() => {
                videoObj.playbackRate = ra;
            }, 1 * 1000);
            localStorage.setItem(keyPlayRate, ra);
            document.querySelector("a[id=" + "'" + ra + "x']").style = btstyleC;
            document.getElementById("playrate").innerHTML = "当前播放速率" + ra + "x";
            //console.log("倍率调整为" + ra);
        } catch (error) { console.log("倍率调整错误" + error); };
    };
    function addrateinfo() {//插入说明
        let adiv1 = document.createElement("div");
        adiv1.innerHTML = '当前播放速率';
        adiv1.id = 'playrate';
        adiv1.style = "font-size: 15px;text-align: center;margin-top: 10px;";
        document.querySelector("div[id='jj']").parentNode.append(adiv1);

    };
    function addinfo() {//插入说明
        //模式切换按钮
        var moderesult = localStorage.getItem("华医mode");
        if (moderesult == 2) {
            moderesult = "当前模式：视频+考试";
        } else {//包括了结果为1或者无存储的情况
            moderesult = "当前模式：单刷视频";
        };
        var checkbox = document.createElement('div');
        checkbox.innerHTML = '<a id="mode" class="btn btn-default" style="background-color: rgba(184, 247, 255, 0.7);font-size:22px;" >' + moderesult + '<br> [点击此处切换]</a > ';

        // 添加到页面的 body 元素中
        document.querySelector("div[id='jj']").parentNode.append(checkbox);
        //插入说明部分
        let mode1 = document.querySelector("a[id='mode']");
        mode1.onclick = function () {
            if (mode1.innerText == "当前模式：单刷视频\n[点击此处切换]") {
                mode1.innerText = "当前模式：视频+考试\n[点击此处切换]";
                localStorage.setItem("华医mode", "2");
            } else {
                mode1.innerText = "当前模式：单刷视频\n[点击此处切换]";
                localStorage.setItem("华医mode", "1");
            };
        };

        let adiv2 = document.createElement("div");
        adiv2.innerHTML = '&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp本人医学研一学生，经常要帮师兄师姐刷华医视频，属实太累。偶然在抖音发现Dr.S的脚本，结果刷完1个视频立刻考试，导致频繁人脸识别跟手动区别不大。原作者已不更新，于是我自学修改了播放逻辑，实现无人值守连续播放。现将原先自用的脚本分享给大家❤❤<br><h3>&nbsp&nbsp&nbsp&nbsp&nbsp刷完视频再切换考试模式，即可连续考试。</h3>';
        adiv2.id = 'jsinfo';
        adiv2.style = "position:relative;left:10px;width:250px;font-size:12px;text-align:left;border: 1px dashed #ff9595;";
        document.querySelector("div[id='jj']").parentNode.append(adiv2);
    };

    function changelayout() {
        var mmcode = `data:image/jpeg;base64,/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAA8AAD/4QMdaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzEzOCA3OS4xNTk4MjQsIDIwMTYvMDkvMTQtMDE6MDk6MDEgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjBDQjlBRjVDOUZFOTExRUVBOUUyODgxQjZGNzBBQzMxIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjBDQjlBRjVCOUZFOTExRUVBOUUyODgxQjZGNzBBQzMxIiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE3IFdpbmRvd3MiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0iRTkzRjNDMUJENUZFQUYxNzMyNDcxQ0FDQ0ZBMTI0MTUiIHN0UmVmOmRvY3VtZW50SUQ9IkU5M0YzQzFCRDVGRUFGMTczMjQ3MUNBQ0NGQTEyNDE1Ii8+IDwvcmRmOkRlc2NyaXB0aW9uPiA8L3JkZjpSREY+IDwveDp4bXBtZXRhPiA8P3hwYWNrZXQgZW5kPSJyIj8+/+4ADkFkb2JlAGTAAAAAAf/bAIQABgQEBAUEBgUFBgkGBQYJCwgGBggLDAoKCwoKDBAMDAwM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`
        document.querySelector("div[id='jj']").remove();
        document.querySelector("img[id='photo']").outerHTML = `<img id="photo" alt="" src="` + mmcode + `" style="width: 120px; height: 120px;">`;
        document.querySelector("img[id='photo']").style.width = "120px";
        document.querySelector("img[id='photo']").style.height = "120px";

        document.querySelectorAll("div[class='title']")[0].children[0].style = "color: #ff0000;font-weight: bold";
        document.querySelectorAll("div[class='title']")[0].children[0].innerText = "支持作者";
        document.querySelector("div[class='imgtext']").children[1].style.width = "125px";
        document.querySelector("div[class='imgtext']").children[1].style = "color: #ff0000";
        document.querySelector("div[class='imgtext']").children[1].innerText = "作 者\n创作优化不易\n投点小费吧\n❤谢啦❤\n❤"
        //document.querySelector("div[class='imgtext']").children[1].style.left = "10px";
        document.querySelector("div[class='top']").outerHTML = '<div class="top" style="padding-top: 6px;font-size:18px;color: #ff0000;">如服务器调整，脚本可能失效。反馈意见、免费增加课程请在Greasyfork私信或脚本反馈区联络。也欢迎投喂↓</div>';
        document.querySelector("div[id='jxmb']").innerHTML = "如果你想对脚本表示肯定或意见，可以通过赞赏码备注；如果要与我反复交流，则需移步到下载本脚本的页面，在“反馈”区留下意见或直接私信我。<br><br>&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp由于脚本工作原理是根据当前网址决定是否运行代码，所以网址未适配则将不运行；页面改版也可能导致脚本报错不运行。这类问题与我交流是有解决可能性的，业余时间可免费受理。";
        document.querySelector("div[id='jxmb']").style.fontSize = "14px";
        if (document.querySelector(".coent .l .videolist .bnt1_0") != null) {
            document.querySelector(".coent .l .videolist .bnt1_0").style.backgroundImage = "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB8AAABsCAIAAAAdev4BAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTM4IDc5LjE1OTgyNCwgMjAxNi8wOS8xNC0wMTowOTowMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTcgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOkMwMkVFQjM1MDUyRTExRUZCNTIyRUVGNEI2NjBBRUIyIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOkMwMkVFQjM2MDUyRTExRUZCNTIyRUVGNEI2NjBBRUIyIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6QzAyRUVCMzMwNTJFMTFFRkI1MjJFRUY0QjY2MEFFQjIiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6QzAyRUVCMzQwNTJFMTFFRkI1MjJFRUY0QjY2MEFFQjIiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz7h7g0VAAAHHElEQVR42uxa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')";
            document.querySelector("#bnt1 > div > h4").remove();//删除教学目标里的子标题“教学目标”
        } else {
            console.log("无教学目标");
        };

    };

    function cleanKeyStorage() {//缓存清理
        localStorage.removeItem(keyTest);
        localStorage.removeItem(keyResult);
        localStorage.removeItem(keyTestAnswer);
        localStorage.removeItem(keyRightAnswer);
    };
    function examherftest() {//考试按钮激活状态检测
        var hreftest = document.getElementById("jrks").attributes["href"].value;
        //console.log("测试考试"+hreftest);
        if (hreftest != "#") {//value不为#说明考试按钮已经激活
            if (document.querySelector("a[id='mode']").innerText.indexOf("视频+考试") != -1) {
                console.log("mode=2,阿み杰准备进入考试");
                clickexam();//阿み杰不想考试
            } else {
                console.log("mode=1,准备单刷视频");
                //自动播放下一个视频的
                const targetElements = document.querySelectorAll("i[id='top_play']");
                const parentElement = targetElements[0].parentElement;
                const grandparentElement = parentElement.parentElement;

                const lis = document.querySelectorAll("li[class='lis-inside-content']");
                var index = Array.from(lis).findIndex(li => li === grandparentElement);
                console.log(index);
                if (index + 2 <= document.querySelectorAll("li[class='lis-inside-content']").length) {
                    index += 2;
                    console.log("新的Index" + index);
                    document.querySelector("#top_body > div.video-container > div.page-container > div.page-content > ul > li:nth-child(" + index + ") > h2").click();
                    setTimeout(function () {
                        document.evaluate("//button[contains(., '知道了')]", document, null, XPathResult.ANY_TYPE).iterateNext().click();
                    }, 2000);
                };
            };
        } else {//#代表考试按钮还没激活
            //继续播放，无需任何操作
        };
    };
    //课堂问答跳过，临时版
    function sleep(timeout) {
        return new Promise((resolve) => { setTimeout(resolve, timeout); });
        console.log("课堂问答循环调用");
    };
    function asynckillsendQuestion() {
        (async function () {
            while (!window.player || !window.player.sendQuestion) {
                await sleep(20);
            };
            //console.log("课堂问答跳过插入");
            player.sendQuestion = function () {
                //console.log("播放器尝试弹出课堂问答，已屏蔽。");
            };
        })();
    };
    function killsendQuestion2() {
        if (typeof (isInteraction) == "undefined") {
            //console.log('变量未定义');
        } else {
            console.log('isInteraction设置off');
            isInteraction = "off";
        };
    };
    function killsendQuestion3() { //点击跳过按钮版的跳过课堂答题
        setInterval(async function () {
            try {
                if ($('.pv-ask-head').length && $('.pv-ask-head').length > 0) {
                    console.log("检测到问题对话框，尝试跳过");
                    $(".pv-ask-skip").click();
                };
            } catch (err) {
                console.log(err);
            };
            try {
                if ($('.signBtn').length && $('.signBtn').length > 0) {
                    console.log("检测到签到对话框，尝试跳过");
                    $(".signBtn").click();
                };
            } catch (err) {
                console.log(err);
            };
            try {
                if ($("button[onclick='closeBangZhu()']").length && $("button[onclick='closeBangZhu()']").length > 0 && $("div[id='div_processbar_tip']").css("display") == "block") {
                    console.log("检测到温馨提示对话框（不能拖拽），尝试跳过");//
                    $("button[onclick='closeBangZhu()']").click();
                };
            } catch (err) {
                console.log(err);
            };
            try {
                if ($("button[class='btn_sign']").length && $("button[class='btn_sign']").length > 0) {
                    console.log("检测到温馨提示对话框（疲劳提醒），尝试跳过");
                    $("button[class='btn_sign']").click();
                };
            } catch (err) {
                console.log(err);
            };
            try {
                if ($('video').prop('paused') == true) {
                    console.log("视频意外暂停，恢复播放");
                    $('video').get(0).play();
                };
            } catch (err) {
                console.log(err);
            };
        }, 2000);
    };

    //---------------------------------全局函数区end------------------------------//



})();
