function onRequest(env) {

    var data = {};
    data.success = true;
    var session = getSession();
    var userUniqueId = session.getUser().getUserId();
    var requestMethod = env.request.method;
    var action = env.request.formParams["action"];

    if (requestMethod == "POST" && action == "add-question") {

        // Add question flow.
        var answer = env.request.formParams["question-answer"];
        var ids = env.request.formParams["question_list"];
        var idsArray = ids.split(":");
        var questionSetId = idsArray[0];
        var questionId = idsArray[1];
        setChallengeAnswer(userUniqueId, answer, questionSetId, questionId);
    } else if (requestMethod== "POST" && action == "update-question") {

        // Update question answer flow.
        var oldPassword = env.request.formParams["old-password"];
        var newAnswer = env.request.formParams["new-answer"];
        questionId = env.request.formParams["question-id"];
        questionSetId = env.request.formParams["question-set-id"];
        var username = session.getUser().getUsername();
        var result = authenticate(username, oldPassword);
        if (result.success) {
            setChallengeAnswer(userUniqueId, newAnswer, questionSetId, questionId);
        } else {
            data.success = result.success;
            data.message = result.message;
        }
    } else if (requestMethod== "POST" && action == "delete-question") {

        // Delete question flow.
        questionId = env.request.formParams["questionid"];
        deleteQuestion(userUniqueId, questionId);
    }

    result = getUserQuestions(userUniqueId);

    if (result.data.length === 0) {
        data.isUserHasQuestions = false;
    } else {
        data.isUserHasQuestions = true;
        data.userQuestions = result.data;
    }

    data.questionList = getChallengeQuestions().data;

    return data;
}

function getUserQuestions(userUniqueId) {

    var result = {};

    var challengeQuestions = callOSGiService("org.wso2.is.portal.user.client.api.ChallengeQuestionManagerClientService",
        "getAllChallengeQuestionsForUser", [userUniqueId]);

    result.success = true;
    result.message = "";

    result.data = challengeQuestions;

    return result;
}

function getChallengeQuestions() {

    var result = {};

    var challengeQuestions = callOSGiService("org.wso2.is.portal.user.client.api.ChallengeQuestionManagerClientService",
        "getChallengeQuestionList", []);

    result.success = true;
    result.message = "";
    result.data = challengeQuestions;

    return result;
}

function addChallengeQuestion() {

}

function setChallengeAnswer(userUniqueId, answer, questionSetId, questionId) {

    callOSGiService("org.wso2.is.portal.user.client.api.ChallengeQuestionManagerClientService",
        "setChallengeQuestionForUser", [userUniqueId, questionId, questionSetId, answer]);
}

function deleteQuestion(userUniqueId, questionId) {

    callOSGiService("org.wso2.is.portal.user.client.api.ChallengeQuestionManagerClientService",
        "deleteChallengeQuestionForUser", [userUniqueId, questionId]);
}

function authenticate(username, password) {
    try {
        var passwordChar = Java.to(password.split(''), 'char[]');
        callOSGiService("org.wso2.is.portal.user.client.api.IdentityStoreClientService",
            "authenticate", [username, passwordChar]);
        return {success: true, message: ""};
    } catch (e) {
        var message = e.message;
        var cause = e.getCause();
        if (cause != null) {
            //the exceptions thrown by the actual osgi service method is wrapped inside a InvocationTargetException.
            if (cause instanceof java.lang.reflect.InvocationTargetException) {
                message = cause.getTargetException().message;
            }
        }
        return {success: false, message: message};
    }
}